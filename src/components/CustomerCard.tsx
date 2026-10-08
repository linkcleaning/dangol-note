import { useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Copy,
  MessageSquare,
  Pencil,
  Phone,
  StickyNote,
} from 'lucide-react';
import type { Customer, Settings } from '../types';
import {
  copyText,
  fillTemplate,
  formatKDate,
  formatPhone,
  getStatus,
  onlyDigits,
  smsHref,
  statusLabel,
} from '../utils';

interface Props {
  customer: Customer;
  settings: Settings;
  today: string;
  onEdit: (c: Customer) => void;
  onVisited: (c: Customer) => void;
  onContacted: (c: Customer) => void;
  notify: (msg: string) => void;
}

const BADGE: Record<string, string> = {
  overdue: 'bg-rose-100 text-rose-700',
  today: 'bg-amber-100 text-amber-800',
  soon: 'bg-sky-100 text-sky-700',
  ok: 'bg-stone-100 text-stone-600',
};

export default function CustomerCard({
  customer: c,
  settings,
  today,
  onEdit,
  onVisited,
  onContacted,
  notify,
}: Props) {
  const [open, setOpen] = useState(false);
  const s = getStatus(c, today);
  const message = fillTemplate(settings, c, today);

  const handleCopy = async () => {
    const ok = await copyText(message);
    if (ok) {
      onContacted(c);
      notify('문구를 복사했어요. 카카오톡에 붙여넣으세요.');
    } else {
      notify('복사에 실패했어요. 문구를 길게 눌러 직접 복사해 주세요.');
      setOpen(true);
    }
  };

  const handleVisited = () => {
    if (confirm(`${c.name}님의 최근 방문일을 오늘로 변경할까요?`)) {
      onVisited(c);
      notify(`${c.name}님 방문 완료! 다음 연락일이 새로 계산됐어요.`);
    }
  };

  return (
    <article
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        s.needsContact ? 'border-teal-200' : 'border-stone-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-stone-900">{c.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[s.level]}`}>
              {statusLabel(s)}
            </span>
            {s.contacted && (
              <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                <CheckCircle2 size={12} /> 연락함
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            {formatPhone(c.phone)}
            {c.service && <> · {c.service}</>}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            최근 방문 {formatKDate(c.lastVisit)} ({s.daysSince}일 전) · 주기 {c.cycleDays}일 · 다음{' '}
            {formatKDate(s.dueDate)}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="-mr-1 rounded-full p-1.5 text-stone-400 active:bg-stone-100"
          aria-label="자세히"
        >
          <ChevronDown size={20} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          {c.memo && (
            <p className="flex gap-1.5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <StickyNote size={16} className="mt-0.5 shrink-0" />
              <span className="whitespace-pre-wrap">{c.memo}</span>
            </p>
          )}
          <p className="select-text whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">
            {message}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${onlyDigits(c.phone)}`}
              className="flex h-11 items-center justify-center gap-1 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 active:bg-stone-100"
            >
              <Phone size={16} /> 전화
            </a>
            <button
              type="button"
              onClick={handleVisited}
              className="flex h-11 items-center justify-center gap-1 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 active:bg-stone-100"
            >
              <CalendarCheck size={16} /> 방문완료
            </button>
            <button
              type="button"
              onClick={() => onEdit(c)}
              className="flex h-11 items-center justify-center gap-1 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 active:bg-stone-100"
            >
              <Pencil size={16} /> 수정
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <a
          href={smsHref(c.phone, message)}
          onClick={() => onContacted(c)}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-teal-700 text-[15px] font-semibold text-white active:bg-teal-800"
        >
          <MessageSquare size={18} /> 문자 보내기
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-yellow-300 text-[15px] font-semibold text-stone-900 active:bg-yellow-400"
        >
          <Copy size={18} /> 문구 복사
        </button>
      </div>
    </article>
  );
}

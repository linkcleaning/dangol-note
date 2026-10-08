import { useState } from 'react';
import { BellRing, CheckCircle2, ChevronDown, Clock, Sparkles, UserPlus, Users } from 'lucide-react';
import type { Customer, Settings } from '../types';
import { byUrgency, getStatus, SOON_DAYS } from '../utils';
import CustomerCard from './CustomerCard';

interface Props {
  customers: Customer[];
  settings: Settings;
  today: string;
  onAdd: () => void;
  onLoadSample: () => void;
  onEdit: (c: Customer) => void;
  onVisited: (c: Customer) => void;
  onContacted: (c: Customer) => void;
  notify: (msg: string) => void;
}

export default function Dashboard({
  customers,
  settings,
  today,
  onAdd,
  onLoadSample,
  ...cardActions
}: Props) {
  const [showSoon, setShowSoon] = useState(true);
  const [showDone, setShowDone] = useState(false);

  const sorted = [...customers].sort(byUrgency(today));
  const withStatus = sorted.map((c) => ({ c, s: getStatus(c, today) }));
  const due = withStatus.filter((x) => x.s.needsContact).map((x) => x.c);
  const soon = withStatus.filter((x) => x.s.level === 'soon' && !x.s.contacted).map((x) => x.c);
  const doneThisCycle = withStatus
    .filter((x) => x.s.contacted && x.s.daysLeft <= SOON_DAYS)
    .map((x) => x.c);

  const month = today.slice(0, 7);
  const visitedThisMonth = customers.filter((c) => c.lastVisit.startsWith(month)).length;

  const cardProps = { settings, today, ...cardActions };

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 pt-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Users size={32} />
        </div>
        <h2 className="text-xl font-bold">첫 단골을 등록해 보세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          최근 방문일과 관리 주기만 넣으면
          <br />
          연락할 때가 된 고객을 매일 알려드려요.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800"
        >
          <UserPlus size={18} /> 고객 등록하기
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className="mt-3 flex h-11 items-center gap-1.5 px-4 text-sm font-medium text-stone-500"
        >
          <Sparkles size={16} /> 예시 고객으로 둘러보기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 pt-4">
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-teal-700 p-4 text-white shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-teal-100">
            <BellRing size={16} /> 오늘 연락할 단골
          </div>
          <p className="mt-2 text-3xl font-extrabold">
            {due.length}
            <span className="ml-0.5 text-lg font-semibold">명</span>
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-1.5 text-sm text-stone-500">
            <Users size={16} /> 이번 달 방문 고객
          </div>
          <p className="mt-2 text-3xl font-extrabold text-stone-900">
            {visitedThisMonth}
            <span className="ml-0.5 text-lg font-semibold">명</span>
          </p>
          <p className="text-xs text-stone-400">전체 단골 {customers.length}명</p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-base font-bold">
          <BellRing size={18} className="text-teal-700" /> 오늘 연락할 고객
          <span className="text-sm font-medium text-stone-400">{due.length}명</span>
        </h2>
        {due.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-500">
            <CheckCircle2 size={18} className="text-teal-600" />
            오늘은 연락할 고객이 없어요. 수고하셨어요!
          </div>
        ) : (
          <div className="space-y-3">
            {due.map((c) => (
              <CustomerCard key={c.id} customer={c} {...cardProps} />
            ))}
          </div>
        )}
      </section>

      {soon.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowSoon((v) => !v)}
            className="mb-2 flex w-full items-center gap-1.5 text-base font-bold"
          >
            <Clock size={18} className="text-sky-600" /> {SOON_DAYS}일 안에 연락할 고객
            <span className="text-sm font-medium text-stone-400">{soon.length}명</span>
            <ChevronDown size={18} className={`ml-auto text-stone-400 transition-transform ${showSoon ? 'rotate-180' : ''}`} />
          </button>
          {showSoon && (
            <div className="space-y-3">
              {soon.map((c) => (
                <CustomerCard key={c.id} customer={c} {...cardProps} />
              ))}
            </div>
          )}
        </section>
      )}

      {doneThisCycle.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="mb-2 flex w-full items-center gap-1.5 text-base font-bold text-stone-500"
          >
            <CheckCircle2 size={18} className="text-teal-600" /> 연락 완료 (방문 대기)
            <span className="text-sm font-medium text-stone-400">{doneThisCycle.length}명</span>
            <ChevronDown size={18} className={`ml-auto text-stone-400 transition-transform ${showDone ? 'rotate-180' : ''}`} />
          </button>
          {showDone && (
            <div className="space-y-3">
              {doneThisCycle.map((c) => (
                <CustomerCard key={c.id} customer={c} {...cardProps} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

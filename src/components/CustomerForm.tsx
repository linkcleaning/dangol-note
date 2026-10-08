import { useEffect, useState, type FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import type { Customer } from '../types';
import { formatPhone, newId, onlyDigits, todayStr } from '../utils';

const PRESETS = [30, 60, 90];

interface Props {
  initial: Customer | null;
  serviceSuggestions: string[];
  onSave: (c: Customer) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function CustomerForm({ initial, serviceSuggestions, onSave, onDelete, onClose }: Props) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial ? formatPhone(initial.phone) : '');
  const [lastVisit, setLastVisit] = useState(initial?.lastVisit ?? todayStr());
  const initialCycle = initial?.cycleDays ?? 30;
  const [customMode, setCustomMode] = useState(!PRESETS.includes(initialCycle));
  const [cycleDays, setCycleDays] = useState(String(initialCycle));
  const [service, setService] = useState(initial?.service ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [error, setError] = useState('');

  // 시트가 열려 있는 동안 뒤 화면 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const digits = onlyDigits(phone);
    const cycle = Number(cycleDays);
    if (!name.trim()) return setError('고객명을 입력해 주세요.');
    if (digits.length < 9) return setError('연락처를 정확히 입력해 주세요.');
    if (!lastVisit) return setError('최근 방문일을 선택해 주세요.');
    if (lastVisit > todayStr()) return setError('최근 방문일은 오늘 이후일 수 없어요.');
    if (!Number.isFinite(cycle) || cycle < 1 || cycle > 3650)
      return setError('관리 주기는 1~3650일 사이로 입력해 주세요.');

    onSave({
      id: initial?.id ?? newId(),
      name: name.trim(),
      phone: digits,
      lastVisit,
      cycleDays: Math.round(cycle),
      service: service.trim(),
      memo: memo.trim(),
      // 방문일이 바뀌면 지난 연락 기록은 유지하되 새 주기 계산에 맞게 자동 판정됨
      lastContactedAt: initial?.lastContactedAt,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    });
  };

  const inputCls =
    'h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet pb-safe flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-stone-50 sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold">{isEdit ? '고객 정보 수정' : '새 고객 등록'}</h2>
          <button type="button" onClick={onClose} className="-mr-2 rounded-full p-2 text-stone-500 active:bg-stone-200" aria-label="닫기">
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              고객명 <span className="text-rose-500">*</span>
            </span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className={inputCls} autoComplete="off" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              연락처 <span className="text-rose-500">*</span>
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-1234-5678"
              inputMode="tel"
              type="tel"
              className={inputCls}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              최근 방문일 <span className="text-rose-500">*</span>
            </span>
            <input
              type="date"
              value={lastVisit}
              max={todayStr()}
              onChange={(e) => setLastVisit(e.target.value)}
              className={inputCls}
            />
          </label>

          <div>
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">
              관리 주기 <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((d) => {
                const active = !customMode && Number(cycleDays) === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setCustomMode(false);
                      setCycleDays(String(d));
                    }}
                    className={`h-11 rounded-xl text-sm font-semibold ${
                      active ? 'bg-teal-700 text-white' : 'border border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    {d}일
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCustomMode(true)}
                className={`h-11 rounded-xl text-sm font-semibold ${
                  customMode ? 'bg-teal-700 text-white' : 'border border-stone-200 bg-white text-stone-600'
                }`}
              >
                직접 입력
              </button>
            </div>
            {customMode && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={3650}
                  value={cycleDays}
                  onChange={(e) => setCycleDays(e.target.value)}
                  className={inputCls}
                  placeholder="예: 45"
                  autoFocus
                />
                <span className="shrink-0 text-stone-600">일마다</span>
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">서비스 항목</span>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="예: 에어컨 청소, 젤네일, 커트"
              list="service-suggestions"
              className={inputCls}
              autoComplete="off"
            />
            <datalist id="service-suggestions">
              {serviceSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-stone-700">메모</span>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="선호 스타일, 주의사항 등"
              className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3.5 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </label>

          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{error}</p>}
        </div>

        <footer className="flex gap-2 border-t border-stone-200 px-5 pt-3">
          {isEdit && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`${initial!.name}님을 삭제할까요? 되돌릴 수 없어요.`)) onDelete(initial!.id);
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-600 active:bg-rose-50"
              aria-label="삭제"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button type="submit" className="h-12 flex-1 rounded-xl bg-teal-700 font-semibold text-white active:bg-teal-800">
            {isEdit ? '수정 완료' : '등록하기'}
          </button>
        </footer>
      </form>
    </div>
  );
}

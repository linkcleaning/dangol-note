import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Customer, Settings } from '../types';
import { byUrgency, getStatus, onlyDigits } from '../utils';
import CustomerCard from './CustomerCard';

type Filter = 'all' | 'due' | 'soon' | 'ok';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'due', label: '연락 필요' },
  { key: 'soon', label: '곧 도래' },
  { key: 'ok', label: '여유' },
];

interface Props {
  customers: Customer[];
  settings: Settings;
  today: string;
  onEdit: (c: Customer) => void;
  onVisited: (c: Customer) => void;
  onContacted: (c: Customer) => void;
  notify: (msg: string) => void;
}

export default function CustomerList({ customers, settings, today, ...cardActions }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const result = useMemo(() => {
    const q = query.trim();
    const qDigits = onlyDigits(q);
    return [...customers]
      .filter((c) => {
        if (!q) return true;
        if (c.name.includes(q)) return true;
        if (c.service.includes(q)) return true;
        // 전화번호: 뒷자리 또는 일부 숫자로 검색
        return qDigits.length > 0 && onlyDigits(c.phone).includes(qDigits);
      })
      .filter((c) => {
        if (filter === 'all') return true;
        const s = getStatus(c, today);
        if (filter === 'due') return s.needsContact;
        if (filter === 'soon') return s.level === 'soon';
        return s.level === 'ok';
      })
      .sort(byUrgency(today));
  }, [customers, query, filter, today]);

  return (
    <div className="px-4 pt-4">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름, 전화번호 뒷자리, 서비스 검색"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-10 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 active:bg-stone-100"
            aria-label="검색어 지우기"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`h-9 shrink-0 rounded-full px-4 text-sm font-medium ${
              filter === f.key
                ? 'bg-stone-900 text-white'
                : 'border border-stone-200 bg-white text-stone-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-3 text-sm text-stone-500">
        {result.length}명 / 전체 {customers.length}명
      </p>

      {result.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">
          {customers.length === 0 ? '아직 등록된 고객이 없어요.' : '조건에 맞는 고객이 없어요.'}
        </p>
      ) : (
        <div className="space-y-3">
          {result.map((c) => (
            <CustomerCard key={c.id} customer={c} settings={settings} today={today} {...cardActions} />
          ))}
        </div>
      )}
    </div>
  );
}

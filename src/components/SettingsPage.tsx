import { useRef, type ChangeEvent } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Customer, Settings } from '../types';
import { DEFAULT_TEMPLATE } from '../storage';
import {
  addDays,
  customersToCSV,
  saveFile,
  fillTemplate,
  normalizeImported,
  TEMPLATE_TOKENS,
} from '../utils';

interface Props {
  settings: Settings;
  customers: Customer[];
  today: string;
  onSettingsChange: (s: Settings) => void;
  onReplaceCustomers: (list: Customer[]) => void;
  onLoadSample: () => void;
  notify: (msg: string) => void;
}

export default function SettingsPage({
  settings,
  customers,
  today,
  onSettingsChange,
  onReplaceCustomers,
  onLoadSample,
  notify,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const importMode = useRef<'merge' | 'replace'>('merge');
  const templateRef = useRef<HTMLTextAreaElement>(null);

  const preview = fillTemplate(
    settings,
    {
      id: 'preview',
      name: '김단골',
      phone: '01012345678',
      lastVisit: addDays(today, -32),
      cycleDays: 30,
      service: '정기 관리',
      memo: '',
      createdAt: '',
    },
    today,
  );

  const insertToken = (token: string) => {
    const ta = templateRef.current;
    const text = settings.template;
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? text.length;
    const next = text.slice(0, start) + token + text.slice(end);
    onSettingsChange({ ...settings, template: next });
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const stamp = today.replace(/-/g, '');

  const exportJSON = async () => {
    const data = {
      app: 'dangol-note',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      customers,
    };
    const r = await saveFile(`단골노트_백업_${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
    if (r !== 'cancelled') notify(`${customers.length}명 백업 파일을 저장했어요.`);
  };

  const exportCSV = async () => {
    const r = await saveFile(`단골노트_고객목록_${stamp}.csv`, customersToCSV(customers, today), 'text/csv');
    if (r !== 'cancelled') notify('엑셀(CSV) 파일을 저장했어요.');
  };

  const pickFile = (mode: 'merge' | 'replace') => {
    importMode.current = mode;
    fileRef.current?.click();
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const imported = normalizeImported(data);
      if (imported.length === 0) {
        notify('가져올 수 있는 고객 데이터가 없어요. 파일을 확인해 주세요.');
        return;
      }
      if (importMode.current === 'replace') {
        if (!confirm(`현재 고객 ${customers.length}명을 지우고, 파일의 ${imported.length}명으로 교체할까요?`)) return;
        onReplaceCustomers(imported);
      } else {
        const map = new Map(customers.map((c) => [c.id, c]));
        imported.forEach((c) => map.set(c.id, c));
        onReplaceCustomers([...map.values()]);
      }
      if (data && typeof data === 'object' && !Array.isArray(data) && data.settings && confirm('백업 파일의 매장명·문구 설정도 불러올까요?')) {
        const s = data.settings as Partial<Settings>;
        onSettingsChange({
          shopName: typeof s.shopName === 'string' ? s.shopName : settings.shopName,
          template: typeof s.template === 'string' ? s.template : settings.template,
        });
      }
      notify(`${imported.length}명의 고객을 가져왔어요.`);
    } catch {
      notify('파일을 읽을 수 없어요. 단골노트 JSON 백업 파일인지 확인해 주세요.');
    }
  };

  const clearAll = () => {
    if (!confirm('모든 고객 데이터를 삭제할까요? 먼저 백업을 권장해요.')) return;
    if (!confirm('정말 삭제할까요? 되돌릴 수 없어요.')) return;
    onReplaceCustomers([]);
    notify('모든 고객 데이터를 삭제했어요.');
  };

  const card = 'rounded-2xl border border-stone-200 bg-white p-4 shadow-sm';
  const btn =
    'flex h-12 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 active:bg-stone-100 disabled:opacity-40';

  return (
    <div className="space-y-4 px-4 pt-4">
      <section className={card}>
        <h2 className="mb-3 flex items-center gap-1.5 font-bold">
          <Store size={18} className="text-teal-700" /> 매장 정보
        </h2>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-stone-700">매장명</span>
          <input
            value={settings.shopName}
            onChange={(e) => onSettingsChange({ ...settings, shopName: e.target.value })}
            placeholder="예: 링크네일"
            className="h-12 w-full rounded-xl border border-stone-200 px-3.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
          />
        </label>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">안내 메시지 문구</h2>
          <button
            type="button"
            onClick={() => {
              if (confirm('기본 문구로 되돌릴까요?')) onSettingsChange({ ...settings, template: DEFAULT_TEMPLATE });
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-500 active:bg-stone-100"
          >
            <RotateCcw size={14} /> 기본값
          </button>
        </div>
        <textarea
          ref={templateRef}
          value={settings.template}
          onChange={(e) => onSettingsChange({ ...settings, template: e.target.value })}
          rows={5}
          className="w-full resize-none rounded-xl border border-stone-200 px-3.5 py-3 leading-relaxed outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
        />
        <p className="mb-2 mt-2 text-xs text-stone-500">눌러서 자동 입력 칸을 넣을 수 있어요</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => insertToken(t)}
              className="h-9 rounded-full bg-teal-50 px-3 text-sm font-medium text-teal-800 active:bg-teal-100"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-stone-500">미리보기</p>
          <p className="whitespace-pre-wrap rounded-xl bg-yellow-50 p-3 text-sm leading-relaxed text-stone-800">{preview}</p>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-1 flex items-center gap-1.5 font-bold">
          <ShieldCheck size={18} className="text-teal-700" /> 백업 및 복원
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-stone-500">
          고객 정보는 이 휴대폰 안에만 저장돼요. 기기 변경·앱 삭제에 대비해 주기적으로 백업하세요. 백업을 누르면 공유 창이 열리니 '파일에 저장'이나 카카오톡 '나와의 채팅'으로 보내 두면 편해요.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={exportJSON} className={btn} disabled={customers.length === 0}>
            <FileJson size={18} /> JSON 백업
          </button>
          <button type="button" onClick={exportCSV} className={btn} disabled={customers.length === 0}>
            <FileSpreadsheet size={18} /> 엑셀(CSV)
          </button>
          <button type="button" onClick={() => pickFile('merge')} className={btn}>
            <Upload size={18} /> 합치기로 복원
          </button>
          <button type="button" onClick={() => pickFile('replace')} className={btn}>
            <Download size={18} /> 덮어쓰기 복원
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" onChange={onFile} className="hidden" />
      </section>

      <section className={`${card} space-y-2`}>
        <button type="button" onClick={onLoadSample} className={`${btn} w-full`}>
          <Sparkles size={18} /> 예시 고객 추가
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-600 active:bg-rose-50"
        >
          <Trash2 size={18} /> 전체 데이터 삭제
        </button>
      </section>

      <p className="pb-2 text-center text-xs text-stone-400">단골노트 v1.0 · 저장된 고객 {customers.length}명</p>
    </div>
  );
}

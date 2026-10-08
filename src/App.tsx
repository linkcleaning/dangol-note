import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Home, Plus, Settings as SettingsIcon, Users } from 'lucide-react';
import type { Customer, Settings, Tab } from './types';
import { DEFAULT_SETTINGS, STORAGE_KEYS, requestPersistentStorage, useLocalStorage } from './storage';
import { getStatus, sampleCustomers, todayStr } from './utils';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import SettingsPage from './components/SettingsPage';
import InstallBanner from './components/InstallBanner';

const TITLES: Record<Tab, string> = {
  home: '오늘의 단골',
  list: '고객 관리',
  settings: '설정',
};

export default function App() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>(STORAGE_KEYS.customers, []);
  const [storedSettings, setSettings] = useLocalStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...storedSettings }), [storedSettings]);

  const [tab, setTab] = useState<Tab>('home');
  const [editing, setEditing] = useState<Customer | 'new' | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // 자정이 지나거나 앱을 다시 열었을 때 날짜 갱신
  const [today, setToday] = useState(todayStr());
  useEffect(() => {
    const refresh = () => setToday(todayStr());
    const id = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    requestPersistentStorage();
  }, []);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const saveCustomer = (c: Customer) => {
    setCustomers((prev) => {
      const exists = prev.some((p) => p.id === c.id);
      return exists ? prev.map((p) => (p.id === c.id ? c : p)) : [c, ...prev];
    });
    notify(editing === 'new' ? `${c.name}님을 등록했어요.` : `${c.name}님 정보를 수정했어요.`);
    setEditing(null);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((p) => p.id !== id));
    setEditing(null);
    notify('삭제했어요.');
  };

  const markVisited = (c: Customer) => {
    setCustomers((prev) => prev.map((p) => (p.id === c.id ? { ...p, lastVisit: today } : p)));
  };

  const markContacted = (c: Customer) => {
    setCustomers((prev) => prev.map((p) => (p.id === c.id ? { ...p, lastContactedAt: today } : p)));
  };

  const loadSample = () => {
    setCustomers((prev) => [...sampleCustomers(), ...prev]);
    notify('예시 고객 4명을 추가했어요.');
    setTab('home');
  };

  const serviceSuggestions = useMemo(
    () => [...new Set(customers.map((c) => c.service).filter(Boolean))].slice(0, 30),
    [customers],
  );

  const dueCount = useMemo(
    () => customers.filter((c) => getStatus(c, today).needsContact).length,
    [customers, today],
  );

  const cardActions = {
    onEdit: (c: Customer) => setEditing(c),
    onVisited: markVisited,
    onContacted: markContacted,
    notify,
  };

  const navItems: { key: Tab; label: string; icon: typeof Home }[] = [
    { key: 'home', label: '홈', icon: Home },
    { key: 'list', label: '고객', icon: Users },
    { key: 'settings', label: '설정', icon: SettingsIcon },
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-stone-50">
      <header className="pt-safe sticky top-0 z-20 border-b border-stone-200/70 bg-stone-50/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{TITLES[tab]}</h1>
          </div>
          <span className="text-sm text-stone-500">{settings.shopName}</span>
        </div>
      </header>

      <main className="pb-32">
        {tab === 'home' && <InstallBanner />}
        {tab === 'home' && (
          <Dashboard
            customers={customers}
            settings={settings}
            today={today}
            onAdd={() => setEditing('new')}
            onLoadSample={loadSample}
            {...cardActions}
          />
        )}
        {tab === 'list' && <CustomerList customers={customers} settings={settings} today={today} {...cardActions} />}
        {tab === 'settings' && (
          <SettingsPage
            settings={settings}
            customers={customers}
            today={today}
            onSettingsChange={setSettings}
            onReplaceCustomers={setCustomers}
            onLoadSample={loadSample}
            notify={notify}
          />
        )}
      </main>

      {tab !== 'settings' && (
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="fixed bottom-24 right-[max(1rem,calc(50%-14rem+1rem))] z-30 flex h-14 items-center gap-1.5 rounded-full bg-teal-700 pl-4 pr-5 font-semibold text-white shadow-lg shadow-teal-900/20 active:bg-teal-800"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus size={22} /> 고객 등록
        </button>
      )}

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                window.scrollTo({ top: 0 });
              }}
              className={`relative flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                tab === key ? 'text-teal-700' : 'text-stone-400'
              }`}
            >
              <Icon size={24} strokeWidth={tab === key ? 2.4 : 2} />
              {label}
              {key === 'home' && dueCount > 0 && (
                <span className="absolute left-1/2 top-2 ml-2 min-w-5 rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-5 text-white">
                  {dueCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {toast && (
        <div className="animate-toast fixed bottom-28 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {editing && (
        <CustomerForm
          initial={editing === 'new' ? null : editing}
          serviceSuggestions={serviceSuggestions}
          onSave={saveCustomer}
          onDelete={deleteCustomer}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

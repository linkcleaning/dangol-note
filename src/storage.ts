import { useEffect, useState } from 'react';
import type { Settings } from './types';

export const STORAGE_KEYS = {
  customers: 'dangol.customers.v1',
  settings: 'dangol.settings.v1',
};

export const DEFAULT_TEMPLATE =
  '[{매장명}] {고객명}님, 지난번 {서비스} 관리 받으신 지 {일수}일이 지났습니다. 점검 예약 도와드릴까요?';

export const DEFAULT_SETTINGS: Settings = {
  shopName: '우리매장',
  template: DEFAULT_TEMPLATE,
};

/** LocalStorage와 자동 동기화되는 state */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('저장 실패', e);
      alert('저장 공간이 부족하거나 브라우저가 저장을 막았습니다. 백업 파일을 내려받아 두세요.');
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** 브라우저가 저장 공간을 임의로 정리하지 않도록 영구 저장 요청 */
export function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => undefined);
    }
  } catch {
    /* 지원하지 않는 브라우저는 무시 */
  }
}

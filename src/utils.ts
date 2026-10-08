import type { Customer, CustomerStatus, Settings } from './types';

const DAY = 24 * 60 * 60 * 1000;

/* ---------------- 날짜 (현지 날짜 기준, 시간대 밀림 방지) ---------------- */

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

function toUTC(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, (m || 1) - 1, d || 1);
}

/** b - a (일) */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY);
}

export function addDays(s: string, n: number): string {
  const t = new Date(toUTC(s) + n * DAY);
  const y = t.getUTCFullYear();
  const m = String(t.getUTCMonth() + 1).padStart(2, '0');
  const d = String(t.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDateStr(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(toUTC(s));
}

export function formatKDate(s: string): string {
  if (!isValidDateStr(s)) return '-';
  const [y, m, d] = s.split('-').map(Number);
  const thisYear = new Date().getFullYear();
  return y === thisYear ? `${m}월 ${d}일` : `${y}. ${m}. ${d}.`;
}

/* ---------------- 상태 계산 ---------------- */

export const SOON_DAYS = 3;

export function getStatus(c: Customer, today: string): CustomerStatus {
  const daysSince = daysBetween(c.lastVisit, today);
  const dueDate = addDays(c.lastVisit, c.cycleDays);
  const daysLeft = daysBetween(today, dueDate);
  const level =
    daysLeft < 0 ? 'overdue' : daysLeft === 0 ? 'today' : daysLeft <= SOON_DAYS ? 'soon' : 'ok';
  // 연락 가능 시점(도래일 - SOON_DAYS) 이후에 연락했다면 이번 주기는 연락 완료로 본다
  const contactWindowStart = addDays(dueDate, -SOON_DAYS);
  const contacted =
    !!c.lastContactedAt &&
    c.lastContactedAt >= contactWindowStart &&
    c.lastContactedAt >= c.lastVisit;
  return {
    daysSince,
    daysLeft,
    dueDate,
    level,
    needsContact: daysLeft <= 0 && !contacted,
    contacted,
  };
}

/** 급한 순서: 많이 지난 고객 → 오늘 → 곧 → 여유 */
export function byUrgency(today: string) {
  return (a: Customer, b: Customer) => {
    const sa = getStatus(a, today);
    const sb = getStatus(b, today);
    if (sa.needsContact !== sb.needsContact) return sa.needsContact ? -1 : 1;
    if (sa.daysLeft !== sb.daysLeft) return sa.daysLeft - sb.daysLeft;
    return a.name.localeCompare(b.name, 'ko');
  };
}

export function statusLabel(s: CustomerStatus): string {
  if (s.daysLeft < 0) return `${-s.daysLeft}일 지남`;
  if (s.daysLeft === 0) return '오늘 연락';
  return `D-${s.daysLeft}`;
}

/* ---------------- 전화번호 ---------------- */

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, '');
}

export function formatPhone(s: string): string {
  const d = onlyDigits(s);
  if (d.startsWith('02')) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

/* ---------------- 메시지 ---------------- */

export const TEMPLATE_TOKENS = ['{매장명}', '{고객명}', '{서비스}', '{일수}', '{최근방문일}'] as const;

export function fillTemplate(settings: Settings, c: Customer, today: string): string {
  const days = Math.max(0, daysBetween(c.lastVisit, today));
  return settings.template
    .split('{매장명}').join(settings.shopName || '')
    .split('{고객명}').join(c.name)
    .split('{서비스}').join(c.service || '')
    .split('{일수}').join(String(days))
    .split('{최근방문일}').join(formatKDate(c.lastVisit));
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** 기본 문자 앱을 여는 링크 (iOS는 &body=, 안드로이드는 ?body=) */
export function smsHref(phone: string, body: string): string {
  const num = onlyDigits(phone);
  const sep = isIOS() ? '&' : '?';
  return `sms:${num}${sep}body=${encodeURIComponent(body)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 아래 대체 방식 시도 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* ---------------- 백업 / 복원 ---------------- */

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 휴대폰: 공유 시트(파일 앱 저장·카카오톡 나에게 보내기 등)로 저장
 * PC 또는 공유 미지원: 일반 다운로드
 */
export async function saveFile(filename: string, content: string, mime: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
  if (isMobile && typeof File !== 'undefined' && navigator.canShare) {
    try {
      const file = new File([content], filename, { type: mime });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return 'shared';
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      /* 공유 실패 시 다운로드로 대체 */
    }
  }
  downloadFile(filename, content, mime);
  return 'downloaded';
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: string | number): string {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function customersToCSV(list: Customer[], today: string): string {
  const header = ['고객명', '연락처', '최근 방문일', '관리 주기(일)', '다음 연락일', '경과일', '서비스', '메모', '마지막 연락일'];
  const rows = list.map((c) => {
    const s = getStatus(c, today);
    return [
      c.name,
      formatPhone(c.phone),
      c.lastVisit,
      c.cycleDays,
      s.dueDate,
      s.daysSince,
      c.service,
      c.memo,
      c.lastContactedAt ?? '',
    ].map(csvCell).join(',');
  });
  // 엑셀에서 한글이 깨지지 않도록 BOM 추가
  return '﻿' + [header.join(','), ...rows].join('\r\n');
}

/** 가져온 JSON을 안전한 Customer 배열로 정리 */
export function normalizeImported(data: unknown): Customer[] {
  const arr: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { customers?: unknown }).customers)
      ? (data as { customers: unknown[] }).customers
      : [];
  const today = todayStr();
  const out: Customer[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    const phone = typeof r.phone === 'string' ? onlyDigits(r.phone) : '';
    if (!name || !phone) continue;
    const cycle = Number(r.cycleDays);
    out.push({
      id: typeof r.id === 'string' && r.id ? r.id : newId(),
      name,
      phone,
      lastVisit: isValidDateStr(r.lastVisit) ? r.lastVisit : today,
      cycleDays: Number.isFinite(cycle) && cycle > 0 ? Math.round(cycle) : 30,
      service: typeof r.service === 'string' ? r.service : '',
      memo: typeof r.memo === 'string' ? r.memo : '',
      lastContactedAt: isValidDateStr(r.lastContactedAt) ? r.lastContactedAt : undefined,
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
    });
  }
  return out;
}

export function sampleCustomers(): Customer[] {
  const t = todayStr();
  const now = new Date().toISOString();
  return [
    { id: newId(), name: '김민지', phone: '01012345678', lastVisit: addDays(t, -35), cycleDays: 30, service: '속눈썹 연장', memo: 'C컬 선호', createdAt: now },
    { id: newId(), name: '박서준', phone: '01098765432', lastVisit: addDays(t, -60), cycleDays: 60, service: '에어컨 청소', memo: '오전 방문 희망', createdAt: now },
    { id: newId(), name: '이하늘', phone: '01055556666', lastVisit: addDays(t, -28), cycleDays: 30, service: '네일', memo: '', createdAt: now },
    { id: newId(), name: '최도윤', phone: '01022223333', lastVisit: addDays(t, -10), cycleDays: 90, service: '정기 점검', memo: '', createdAt: now },
  ];
}

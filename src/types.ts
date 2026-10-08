export interface Customer {
  id: string;
  name: string;
  phone: string;
  /** 최근 방문일 (YYYY-MM-DD) */
  lastVisit: string;
  /** 관리(재방문) 주기, 일 단위 */
  cycleDays: number;
  service: string;
  memo: string;
  /** 마지막으로 안내 연락한 날 (YYYY-MM-DD) */
  lastContactedAt?: string;
  createdAt: string;
}

export interface Settings {
  shopName: string;
  template: string;
}

export type StatusLevel = 'overdue' | 'today' | 'soon' | 'ok';

export interface CustomerStatus {
  daysSince: number;
  daysLeft: number;
  dueDate: string;
  level: StatusLevel;
  /** 연락 시점이 되었고, 아직 이번 주기에 연락하지 않음 */
  needsContact: boolean;
  /** 이번 주기에 이미 연락함 */
  contacted: boolean;
}

export type Tab = 'home' | 'list' | 'settings';

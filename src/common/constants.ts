// ── Auth ─────────────────────────────────────────────────────────────────────
export const BCRYPT_ROUNDS = 12;

// ── Media ─────────────────────────────────────────────────────────────────────
export const MAX_FILE_SIZE_BYTES      = 10 * 1024 * 1024; // 10 MB
export const MAX_PRESIGNED_EXPIRY_SEC = 300;               // 5 min hard cap

// ── Scheduler intervals ───────────────────────────────────────────────────────
export const OVERDUE_CHECK_INTERVAL_MS = 2  * 60 * 60 * 1000; // 2 h
export const DAILY_DIGEST_INTERVAL_MS  = 24 * 60 * 60 * 1000; // 24 h
export const OVERDUE_THRESHOLD_MS      = 48 * 60 * 60 * 1000; // 48 h

// ── Pagination ────────────────────────────────────────────────────────────────
export const MAX_PAGE_OFFSET = 10_000; // page * limit must not exceed this

// ── Notification template names ───────────────────────────────────────────────
export const NOTIFICATION_TEMPLATE = {
  RFQ_RECEIVED:        'rfq-received',
  RFQ_ACKNOWLEDGEMENT: 'rfq-acknowledgement',
  RFQ_STATUS_UPDATE:   'rfq-status-update',
  WELCOME:             'welcome',
  PASSWORD_CHANGED:    'password-changed',
  ADMIN_DAILY_DIGEST:  'admin-daily-digest',
  RFQ_OVERDUE_ALERT:   'rfq-overdue-alert',
  BROADCAST:           'broadcast',
} as const;

export type NotificationTemplateName =
  (typeof NOTIFICATION_TEMPLATE)[keyof typeof NOTIFICATION_TEMPLATE];

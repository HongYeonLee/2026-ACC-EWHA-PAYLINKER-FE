import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(value: string | Date | null | undefined, pattern = 'yyyy-MM-dd HH:mm') {
  if (!value) return '-';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern, { locale: ko });
}

export function formatDateShort(value: string | Date | null | undefined) {
  return formatDate(value, 'MM.dd HH:mm');
}

export function formatRelative(value: string | Date | null | undefined) {
  if (!value) return '-';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return '-';
  return `${formatDistanceToNowStrict(date, { locale: ko })} 전`;
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString('ko-KR');
}

export function maskEmail(email: string) {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export function pluralize(n: number, unit: string) {
  return `${formatNumber(n)}${unit}`;
}

import { cn } from '../lib/cn';

export type IconProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

function base({ size = 16, className, strokeWidth = 1.6 }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn('shrink-0', className),
  };
}

export const Icon = {
  Dashboard: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
  ),
  Send: (p: IconProps) => (
    <svg {...base(p)}><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg>
  ),
  History: (p: IconProps) => (
    <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v5l3 2" /></svg>
  ),
  Alert: (p: IconProps) => (
    <svg {...base(p)}><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.41 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
  ),
  Calendar: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
  ),
  Bell: (p: IconProps) => (
    <svg {...base(p)}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
  ),
  Logout: (p: IconProps) => (
    <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <svg {...base(p)}><path d="m15 18-6-6 6-6" /></svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg {...base(p)}><path d="m9 18 6-6-6-6" /></svg>
  ),
  ChevronDown: (p: IconProps) => (
    <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(p)}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  ),
  Upload: (p: IconProps) => (
    <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>
  ),
  File: (p: IconProps) => (
    <svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
  ),
  Mail: (p: IconProps) => (
    <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
  ),
  User: (p: IconProps) => (
    <svg {...base(p)}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  ),
  Lock: (p: IconProps) => (
    <svg {...base(p)}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...base(p)}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  EyeOff: (p: IconProps) => (
    <svg {...base(p)}><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><path d="m1 1 22 22" /></svg>
  ),
  Filter: (p: IconProps) => (
    <svg {...base(p)}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" /></svg>
  ),
  Inbox: (p: IconProps) => (
    <svg {...base(p)}><polyline points="22 13 16 13 14 16 10 16 8 13 2 13" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></svg>
  ),
  Refresh: (p: IconProps) => (
    <svg {...base(p)}><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 3v6h-6" /></svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
  ),
  Edit: (p: IconProps) => (
    <svg {...base(p)}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" /></svg>
  ),
  Info: (p: IconProps) => (
    <svg {...base(p)}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
  ),
  Logo: (p: IconProps) => (
    <svg {...base({ ...p, strokeWidth: 0 })} fill="currentColor">
      <path d="M4 4h7.5a4.5 4.5 0 0 1 0 9H4V4Zm3 3v3h4.5a1.5 1.5 0 0 0 0-3H7Z" />
      <path d="M13 13h3l4 7h-3l-4-7Z" />
    </svg>
  ),
};

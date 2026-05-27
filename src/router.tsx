import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/LoginPage';
import { CallbackPage } from './features/auth/CallbackPage';
import { AdminLayout } from './features/admin/layout/AdminLayout';
import { DashboardPage } from './features/admin/dashboard/DashboardPage';

// 자주 진입하는 페이지(로그인/대시보드)는 eager import 로 첫 인터랙션 latency 를 최소화하고,
// 나머지 페이지는 라우트 진입 시점에 코드 청크를 동적으로 받는다.
// 효과: 초기 번들 600KB → 위저드 / 캠페인 상세 / 수신자 흐름이 각각 별도 청크로 분리.
//
// React Router v7 의 `lazy` 라우트 옵션은 named export 를 그대로 매핑해 준다.

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <CallbackPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'campaigns',
        lazy: async () => {
          const m = await import('./features/admin/campaigns/CampaignListPage');
          return { Component: m.CampaignListPage };
        },
      },
      {
        path: 'campaigns/new',
        lazy: async () => {
          const m = await import('./features/admin/campaigns/CampaignNewPage');
          return { Component: m.CampaignNewPage };
        },
      },
      {
        path: 'campaigns/:id',
        lazy: async () => {
          const m = await import('./features/admin/campaigns/CampaignDetailPage');
          return { Component: m.CampaignDetailPage };
        },
      },
      {
        path: 'scheduled',
        lazy: async () => {
          const m = await import('./features/admin/campaigns/ScheduledPage');
          return { Component: m.ScheduledPage };
        },
      },
      {
        path: 'checks',
        lazy: async () => {
          const m = await import('./features/admin/checks/ChecksPage');
          return { Component: m.ChecksPage };
        },
      },
      {
        path: 'resend-requests',
        lazy: async () => {
          const m = await import('./features/admin/checks/ResendRequestsPage');
          return { Component: m.ResendRequestsPage };
        },
      },
      {
        path: 'settings',
        lazy: async () => {
          const m = await import('./features/admin/settings/SettingsPage');
          return { Component: m.SettingsPage };
        },
      },
    ],
  },
  {
    path: '/link/:token',
    lazy: async () => {
      const m = await import('./features/recipient/pages/LinkValidatePage');
      return { Component: m.LinkValidatePage };
    },
  },
  {
    path: '/me/document',
    lazy: async () => {
      const m = await import('./features/recipient/pages/DocumentPage');
      return { Component: m.DocumentPage };
    },
  },
  {
    path: '/closed',
    lazy: async () => {
      const m = await import('./features/recipient/pages/DocumentPage');
      return { Component: m.ViewClosedPage };
    },
  },
  {
    path: '/link-error/:reason',
    lazy: async () => {
      const m = await import('./features/recipient/pages/LinkErrorPage');
      return { Component: m.LinkErrorPage };
    },
  },
  { path: '*', element: <Navigate to="/admin" replace /> },
]);

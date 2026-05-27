import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AdminProfile = {
  adminId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'ADMIN' | string;
  createdAt?: string;
};

export type LinkSession = {
  campaignRecipientId: string;
  campaignId: string;
  campaignName: string;
  recipientName: string;
  documentCount: number;
  issuedAt: string;
  expiresAt: string;
};

type AuthState = {
  adminToken: string | null;
  adminProfile: AdminProfile | null;
  linkSessionToken: string | null;
  linkSession: LinkSession | null;
  setAdminSession: (token: string, profile: AdminProfile) => void;
  setAdminProfile: (profile: AdminProfile) => void;
  clearAdmin: () => void;
  setLinkSession: (token: string, session: LinkSession) => void;
  clearLinkSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      adminToken: null,
      adminProfile: null,
      linkSessionToken: null,
      linkSession: null,
      setAdminSession: (token, profile) => set({ adminToken: token, adminProfile: profile }),
      setAdminProfile: (profile) => set({ adminProfile: profile }),
      clearAdmin: () => set({ adminToken: null, adminProfile: null }),
      setLinkSession: (token, session) => set({ linkSessionToken: token, linkSession: session }),
      clearLinkSession: () => set({ linkSessionToken: null, linkSession: null }),
    }),
    {
      name: 'paylinker-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        adminToken: state.adminToken,
        adminProfile: state.adminProfile,
        linkSessionToken: state.linkSessionToken,
        linkSession: state.linkSession,
      }),
    },
  ),
);

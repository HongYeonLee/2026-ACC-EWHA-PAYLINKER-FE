import { create } from 'zustand';

type ToastTone = 'success' | 'danger' | 'warn' | 'neutral';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (toast) =>
    set((state) => {
      counter += 1;
      const id = `t-${Date.now()}-${counter}`;
      return { toasts: [...state.toasts, { id, ...toast }] };
    }),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().show({ title, description, tone: 'success' }),
  error: (title: string, description?: string) =>
    useToastStore.getState().show({ title, description, tone: 'danger' }),
  warn: (title: string, description?: string) =>
    useToastStore.getState().show({ title, description, tone: 'warn' }),
  info: (title: string, description?: string) =>
    useToastStore.getState().show({ title, description, tone: 'neutral' }),
};

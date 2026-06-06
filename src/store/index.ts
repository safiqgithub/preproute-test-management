import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

interface TestCreationState {
  testId: string | null;
  testData: any | null;
  questions: any[];
  setTestId: (id: string) => void;
  setTestData: (data: any) => void;
  addQuestion: (q: any) => void;
  setQuestions: (qs: any[]) => void;
  removeQuestion: (index: number) => void;
  reset: () => void;
}

export const useTestCreationStore = create<TestCreationState>((set) => ({
  testId: null,
  testData: null,
  questions: [],
  setTestId: (id) => set({ testId: id }),
  setTestData: (data) => set({ testData: data }),
  addQuestion: (q) => set((s) => ({ questions: [...s.questions, q] })),
  setQuestions: (qs) => set({ questions: qs }),
  removeQuestion: (index) => set((s) => ({ questions: s.questions.filter((_, i) => i !== index) })),
  reset: () => set({ testId: null, testData: null, questions: [] }),
}));

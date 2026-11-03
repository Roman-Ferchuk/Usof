import { createSlice } from '@reduxjs/toolkit';

let nextId = 1;

const THEME_KEY = 'theme';

/* The inline script in index.html has already put the theme on <html>, so read it from there. */
const initialTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

const slice = createSlice({
  name: 'ui',
  initialState: { toasts: [], theme: initialTheme() },
  reducers: {
    toast: {
      reducer: (s, a) => { s.toasts.push(a.payload); },
      prepare: (text, kind = 'error') => {
        const id = nextId;
        nextId += 1;
        return { payload: { id, text, kind } };
      },
    },
    dismissToast: (s, a) => { s.toasts = s.toasts.filter((t) => t.id !== a.payload); },
    toggleTheme: (s) => {
      s.theme = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = s.theme;
      try { localStorage.setItem(THEME_KEY, s.theme); } catch (e) { /* private mode: the choice just is not remembered */ }
    },
  },
});

export const { toast, dismissToast, toggleTheme } = slice.actions;
export default slice.reducer;

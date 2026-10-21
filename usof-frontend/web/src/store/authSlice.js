import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, norm } from '../api/client';

const jwtId = (token) => {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(part)).id;
};

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const data = await api.login(creds);
    localStorage.setItem('token', data.token);
    const raw = data.user || await api.user(jwtId(data.token));
    return norm.user(raw.data || raw);
  } catch (e) { return rejectWithValue(e.message); }
});

export const restore = createAsyncThunk('auth/restore', async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const raw = await api.user(jwtId(token));
    return norm.user(raw.data || raw);
  } catch (e) {
    localStorage.removeItem('token');
    return null;
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.logout(); } catch (e) { /* token may already be invalid */ }
  localStorage.removeItem('token');
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null, ready: false },
  reducers: { setUser: (s, a) => { s.user = a.payload; } },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'idle'; s.user = a.payload; })
      .addCase(login.rejected, (s, a) => { s.status = 'idle'; s.error = a.payload; })
      .addCase(restore.fulfilled, (s, a) => { s.user = a.payload; s.ready = true; })
      .addCase(logout.fulfilled, (s) => { s.user = null; });
  },
});

export const { setUser } = slice.actions;
export default slice.reducer;

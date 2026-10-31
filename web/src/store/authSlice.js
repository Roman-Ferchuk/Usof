import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, norm } from '../api/client';

const jwtId = (token) => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)).id || null;
  } catch (e) { return null; }
};

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const data = await api.login(creds);
    localStorage.setItem('token', data.token);
    return norm.user(data.user);
  } catch (e) { return rejectWithValue(e.message); }
});

export const restore = createAsyncThunk('auth/restore', async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const id = jwtId(token);
  if (!id) {
    localStorage.removeItem('token');
    return null;
  }
  try {
    return norm.user(await api.user(id));
  } catch (e) {
    if (e.status === 401 || e.status === 404) localStorage.removeItem('token');
    return null;
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await api.logout(); } catch (e) { /* the token may already be expired */ }
  localStorage.removeItem('token');
});

const slice = createSlice({
  name: 'auth',
  initialState: { user: null, status: 'idle', error: null, ready: false },
  reducers: {
    setUser: (s, a) => { s.user = a.payload; },
    clearAuthError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'idle'; s.user = a.payload; })
      .addCase(login.rejected, (s, a) => { s.status = 'idle'; s.error = a.payload; })
      .addCase(restore.fulfilled, (s, a) => { s.user = a.payload; s.ready = true; })
      .addCase(restore.rejected, (s) => { s.ready = true; })
      .addCase(logout.fulfilled, (s) => { s.user = null; });
  },
});

export const { setUser, clearAuthError } = slice.actions;
export default slice.reducer;

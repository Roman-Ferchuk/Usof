import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../api/client';

export const fetchStats = createAsyncThunk('stats/fetch', async (_, { rejectWithValue }) => {
  try {
    return await api.stats();
  } catch (e) { return rejectWithValue(e.message); }
});

const slice = createSlice({
  name: 'stats',
  initialState: { data: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchStats.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(fetchStats.fulfilled, (s, a) => { s.status = 'done'; s.data = a.payload; })
      .addCase(fetchStats.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; });
  },
});

export default slice.reducer;

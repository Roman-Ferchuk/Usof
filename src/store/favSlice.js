import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, norm } from '../api/client';

export const FAV_PAGE = 10;

export const fetchFavorites = createAsyncThunk('fav/fetch', async ({ offset = 0 } = {}, { rejectWithValue }) => {
  try {
    const data = await api.favorites({ limit: FAV_PAGE, offset, sort: 'added' });
    return { offset, items: data.map(norm.post), hasMore: data.length === FAV_PAGE };
  } catch (e) { return rejectWithValue(e.message); }
});

export const toggleFavorite = createAsyncThunk('fav/toggle', async ({ id, on }, { rejectWithValue }) => {
  try {
    if (on) await api.removeFavorite(id);
    else await api.addFavorite(id);
    return { id: String(id), on: !on };
  } catch (e) { return rejectWithValue(e.message); }
});

/* `overrides` remembers what the user toggled this session; the server flag `isFavorite` is the baseline. */
const slice = createSlice({
  name: 'favorites',
  initialState: { items: [], overrides: {}, hasMore: false, status: 'idle', error: null },
  reducers: { clearFavorites: (s) => { s.items = []; s.overrides = {}; s.status = 'idle'; } },
  extraReducers: (b) => {
    b.addCase(fetchFavorites.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (s, a) => {
        s.status = 'done';
        s.hasMore = a.payload.hasMore;
        s.items = a.payload.offset ? [...s.items, ...a.payload.items] : a.payload.items;
      })
      .addCase(fetchFavorites.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(toggleFavorite.fulfilled, (s, a) => {
        s.overrides[a.payload.id] = a.payload.on;
        if (!a.payload.on) s.items = s.items.filter((p) => String(p.id) !== a.payload.id);
      });
  },
});

export const { clearFavorites } = slice.actions;
export default slice.reducer;

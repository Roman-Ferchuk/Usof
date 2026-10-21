import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, asList, norm } from '../api/client';

export const fetchFavorites = createAsyncThunk('fav/fetch', async () => {
  const data = await api.favorites();
  return asList(data, 'favorites', 'posts').map((f) => norm.post(f.post || f));
});

export const toggleFavorite = createAsyncThunk('fav/toggle', async ({ id, on }) => {
  if (on) await api.removeFavorite(id);
  else await api.addFavorite(id);
  return { id: String(id), on: !on };
});

const slice = createSlice({
  name: 'favorites',
  initialState: { items: [], ids: [], status: 'idle' },
  extraReducers: (b) => {
    b.addCase(fetchFavorites.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (s, a) => { s.status = 'done'; s.items = a.payload; s.ids = a.payload.map((p) => String(p.id)); })
      .addCase(fetchFavorites.rejected, (s) => { s.status = 'failed'; })
      .addCase(toggleFavorite.fulfilled, (s, a) => {
        const { id, on } = a.payload;
        if (on) s.ids.push(id);
        else {
          s.ids = s.ids.filter((x) => x !== id);
          s.items = s.items.filter((p) => String(p.id) !== id);
        }
      });
  },
});

export default slice.reducer;

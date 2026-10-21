import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, asList, norm, pageInfo } from '../api/client';

export const fetchFeed = createAsyncThunk('feed/fetch', async (p, { rejectWithValue }) => {
  try {
    const data = await api.posts({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      categoryId: p.category,
      search: p.q,
      authorId: p.authorId,
    });
    const items = asList(data, 'posts').map(norm.post);
    return { items, pages: pageInfo(data, items, p.page, p.limit) };
  } catch (e) { return rejectWithValue(e.message); }
});

export const fetchCategories = createAsyncThunk('feed/categories', async () => {
  const data = await api.categories();
  return asList(data, 'categories');
});

const slice = createSlice({
  name: 'feed',
  initialState: { items: [], pages: 1, status: 'idle', error: null, categories: [] },
  reducers: { removePost: (s, a) => { s.items = s.items.filter((p) => p.id !== a.payload); } },
  extraReducers: (b) => {
    b.addCase(fetchFeed.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(fetchFeed.fulfilled, (s, a) => { s.status = 'done'; s.items = a.payload.items; s.pages = a.payload.pages; })
      .addCase(fetchFeed.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; });
  },
});

export const { removePost } = slice.actions;
export default slice.reducer;

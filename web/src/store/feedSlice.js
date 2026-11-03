import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, norm } from '../api/client';

/* Query-string names of the page map to the backend names here. */
export const fetchFeed = createAsyncThunk('feed/fetch', async (p, { rejectWithValue }) => {
  try {
    const data = await api.posts({
      page: p.page,
      limit: p.limit,
      sort: p.sort,
      order: p.order,
      categoryIds: p.category,
      dateFrom: p.from,
      dateTo: p.to,
      status: p.status,
      search: p.q,
      authorId: p.authorId,
    });
    return {
      items: data.data.map(norm.post),
      pages: data.totalPages,
      total: data.total,
    };
  } catch (e) { return rejectWithValue(e.message); }
});

export const fetchCategories = createAsyncThunk('feed/categories', () => api.categories());

const slice = createSlice({
  name: 'feed',
  initialState: { items: [], pages: 1, total: 0, status: 'idle', error: null, categories: [], requestId: null, scope: '' },
  reducers: { removePost: (s, a) => { s.items = s.items.filter((p) => p.id !== a.payload); } },
  extraReducers: (b) => {
    /* requestId guards against out-of-order responses; scope drops posts of another list (home vs. a profile). */
    b.addCase(fetchFeed.pending, (s, a) => {
      const scope = String(a.meta.arg.authorId || '');
      if (s.scope !== scope) s.items = [];
      s.scope = scope;
      s.status = 'loading';
      s.error = null;
      s.requestId = a.meta.requestId;
    })
      .addCase(fetchFeed.fulfilled, (s, a) => {
        if (s.requestId !== a.meta.requestId) return;
        s.status = 'done';
        Object.assign(s, a.payload);
      })
      .addCase(fetchFeed.rejected, (s, a) => {
        if (s.requestId !== a.meta.requestId) return;
        s.status = 'failed';
        s.error = a.payload;
      })
      .addCase(fetchCategories.fulfilled, (s, a) => { s.categories = a.payload; });
  },
});

export const { removePost } = slice.actions;
export default slice.reducer;

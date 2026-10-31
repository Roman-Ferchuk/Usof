import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import feed from './feedSlice';
import favorites from './favSlice';
import stats from './statsSlice';
import ui from './uiSlice';

export default configureStore({
  reducer: {
    auth, feed, favorites, stats, ui,
  },
});

import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import feed from './feedSlice';
import favorites from './favSlice';

export default configureStore({ reducer: { auth, feed, favorites } });

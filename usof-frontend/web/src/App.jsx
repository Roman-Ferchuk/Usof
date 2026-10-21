import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { matchPath, useLocation } from './router';
import { restore } from './store/authSlice';
import { fetchCategories } from './store/feedSlice';
import { fetchFavorites } from './store/favSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Reset from './pages/Reset';
import Editor from './pages/Editor';
import PostPage from './pages/PostPage';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import ConfirmEmail from './pages/ConfirmEmail';
import Admin from './pages/Admin';

const routes = [
  ['/', Home],
  ['/login', Login],
  ['/register', Register],
  ['/reset', Reset],
  ['/reset/:token', Reset],
  ['/new', Editor],
  ['/posts/:id', PostPage],
  ['/posts/:id/edit', Editor],
  ['/profile/:id', Profile],
  ['/favorites', Favorites],
  ['/confirm/:token', ConfirmEmail],
  ['/admin', Admin],
];

export default function App() {
  const dispatch = useDispatch();
  const ready = useSelector((s) => s.auth.ready);
  const userId = useSelector((s) => s.auth.user && s.auth.user.id);
  const { path } = useLocation();

  useEffect(() => {
    dispatch(restore());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (userId) dispatch(fetchFavorites());
  }, [userId, dispatch]);

  const hit = routes
    .map(([pattern, Page]) => ({ Page, params: matchPath(pattern, path) }))
    .find((r) => r.params);

  return (
    <div className="shell">
      <Header />
      <main className="main">
        {!ready && <p className="muted">Loading…</p>}
        {ready && hit && <hit.Page key={path} {...hit.params} />}
        {ready && !hit && <p className="empty">Page not found. <a href="#/">Back to questions</a></p>}
      </main>
      <Footer />
    </div>
  );
}

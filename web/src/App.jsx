import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { matchPath, navigate, useLocation } from './router';
import { restore, setUser } from './store/authSlice';
import { clearFavorites } from './store/favSlice';
import { toast } from './store/uiSlice';
import { fetchCategories } from './store/feedSlice';
import Header from './components/Header';
import Footer from './components/Footer';
import Toasts from './components/Toasts';
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
import Stats from './pages/Stats';

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
  ['/stats', Stats],
  ['/admin', Admin],
];

export default function App() {
  const dispatch = useDispatch();
  const ready = useSelector((s) => s.auth.ready);
  const { path } = useLocation();

  const store = useStore();

  useEffect(() => {
    dispatch(restore());
    dispatch(fetchCategories());
  }, [dispatch]);

  // the API answered 401 while the user was signed in: the token has expired
  useEffect(() => {
    const onExpired = () => {
      if (!store.getState().auth.user) return;
      dispatch(setUser(null));
      dispatch(clearFavorites());
      dispatch(toast('Your session has expired. Please log in again.'));
      navigate('/login');
    };
    window.addEventListener('usof:unauthorized', onExpired);
    return () => window.removeEventListener('usof:unauthorized', onExpired);
  }, [dispatch, store]);

  useEffect(() => { window.scrollTo(0, 0); }, [path]);

  const hit = routes
    .map(([pattern, Page]) => ({ Page, params: matchPath(pattern, path) }))
    .find((r) => r.params);

  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main className="main" id="main" tabIndex="-1">
        {!ready && <p className="muted">Loading…</p>}
        {ready && hit && <hit.Page key={path} {...hit.params} />}
        {ready && !hit && <p className="empty">Page not found. <a href="#/">Back to questions</a></p>}
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}

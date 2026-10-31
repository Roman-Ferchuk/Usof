import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../store/uiSlice';

export default function ThemeToggle() {
  const theme = useSelector((s) => s.ui.theme);
  const dispatch = useDispatch();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="btn btn--ghost theme-toggle"
      onClick={() => dispatch(toggleTheme())}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}

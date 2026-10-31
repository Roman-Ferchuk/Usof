import { Link } from '../router';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__row">
        <strong className="footer__brand">usof</strong>
        <span>Questions and answers for developers.</span>
        <nav aria-label="Footer">
          <Link to="/">Questions</Link>
          <Link to="/?sort=likes">Top rated</Link>
          <Link to="/stats">Statistics</Link>
          <Link to="/favorites">Saved</Link>
        </nav>
      </div>
      <p className="muted">Built with React and Redux on top of the usof API.</p>
    </footer>
  );
}

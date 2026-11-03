export default function AuthLayout({ title, hint, children }) {
  return (
    <div className="auth">
      <aside className="auth__side">
        <span className="auth__mark">usof</span>
        <p>Ask the question that has been stuck in your head. Someone here has hit it before.</p>
      </aside>
      <section className="auth__form">
        <h1>{title}</h1>
        <p className="muted">{hint}</p>
        {children}
      </section>
    </div>
  );
}

function Layout({ title, subtitle, children }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <p className="section-kicker">Agora FST</p>
          <h2>{title}</h2>
          <p className="section-copy">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export default Layout;

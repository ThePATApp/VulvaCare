export function SiteHeader() {
  return (
    <header className="vc-header">
      <div className="vc-logo-wrap">
        <img
          src="/images/vulvacare-logo.svg"
          alt="VulvaCare"
          className="vc-logo"
          width="240"
          height="70"
        />
      </div>
    </header>
  );
}

export function Hero({ children }) {
  return (
    <div className="vc-hero">
      <SiteHeader />
      <section className="vc-hero-grid" aria-labelledby="hero-heading">
        <p className="vc-eyebrow">INGREDIENT TRANSPARENCY, MADE SIMPLE.</p>
        <h1 id="hero-heading">Know what touches your most intimate skin.</h1>
        <p className="vc-hero-lede">
          Understand the ingredients in your intimate care products with clear, <span className="vc-nowrap">AI-powered</span> insights.
        </p>
      </section>
      {children}
    </div>
  );
}

export function Closing() {
  return (
    <section className="vc-closing" aria-labelledby="closing-heading">
      <h2 id="closing-heading">Better information. More confident choices.</h2>
      <p>Because understanding what goes on your body should be simple.</p>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="vc-footer">
      <img
        src="/images/vulvacare-flower.svg"
        alt=""
        className="vc-flower"
        width="48"
        height="48"
      />
      <p className="vc-footer-brand">VulvaCare</p>
      <p>Science-informed intimate wellness.</p>
      <p>Educational information only. Not medical advice.</p>
      <p>© 2026 VulvaCare.</p>
    </footer>
  );
}

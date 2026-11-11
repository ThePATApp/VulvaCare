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

export function Hero() {
  return (
    <section className="vc-hero" aria-labelledby="hero-heading">
      <SiteHeader />
      <div className="vc-hero-grid">
        <div className="vc-hero-copy">
          <p className="vc-eyebrow">INGREDIENT TRANSPARENCY, MADE SIMPLE.</p>
          <h1 id="hero-heading">Know what touches your most intimate skin.</h1>
          <p className="vc-hero-lede">
            Understand the ingredients in your intimate care products with clear, AI-powered insights.
          </p>
        </div>
        <div className="vc-hero-art">
          <img
            src="/images/hero.png"
            alt="Smiling woman in VulvaCare hero artwork"
            width="1122"
            height="1402"
          />
        </div>
      </div>
    </section>
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

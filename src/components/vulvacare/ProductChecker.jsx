import { inferInputType } from '../../lib/vulvacare.js';

export default function ProductChecker({
  draft,
  onDraftChange,
  onSubmit,
  loading,
  error,
  inputRef,
  formRef,
}) {
  const inputType = inferInputType(draft);
  const checkingAs =
    inputType === 'ingredients' ? 'ingredient list' : 'product name';

  return (
    <section className="vc-checker" aria-labelledby="checker-heading" ref={formRef}>
      <div className="vc-checker-card">
        <h2 id="checker-heading">What’s in your product?</h2>
        <p className="vc-lede">
          Enter a product name or paste an ingredient list to explore potential irritation concerns.
        </p>
        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="product-input">Product name or ingredient list</label>
          <textarea
            id="product-input"
            ref={inputRef}
            name="userInput"
            rows={6}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Enter a product name or paste ingredients..."
            autoComplete="off"
            disabled={loading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'checker-error checker-hint' : 'checker-hint'}
          />
          <p className="vc-hint">We’ll check this as a {checkingAs}.</p>
          <p id="checker-hint" className="vc-hint">No account required.</p>
          {error ? (
            <p id="checker-error" className="vc-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="vc-btn vc-btn-primary" type="submit" disabled={loading}>
            {loading ? 'Checking ingredients…' : 'Check ingredients'}
          </button>
        </form>
      </div>
    </section>
  );
}

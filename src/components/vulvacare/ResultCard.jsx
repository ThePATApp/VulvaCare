import { flaggedNames, getStatusMeta } from '../../lib/vulvacare.js';
import { FlagIcon, InfoIcon, StatusGlyph } from './Icons.jsx';

export function ResultCard({ result }) {
  const meta = getStatusMeta(result.status);
  const flags = flaggedNames(result.flaggedIngredients);

  return (
    <article className="vc-result-card" aria-labelledby="result-headline">
      <div className={`vc-status vc-status-${meta.className}`}>
        <span className="vc-status-circle" aria-hidden="true">
          <StatusGlyph status={result.status} />
        </span>
        <span className="vc-status-label">{meta.label}</span>
      </div>
      <h2 id="result-headline">{result.headline}</h2>
      <h3 className="vc-found-heading">What we found</h3>
      <p className="vc-explanation">{result.explanation}</p>
      {flags.length > 0 ? <FlaggedIngredients names={flags} /> : null}
    </article>
  );
}

export function FlaggedIngredients({ names }) {
  return (
    <section className="vc-flags" aria-labelledby="flags-heading">
      <div className="vc-flags-head">
        <h3 id="flags-heading">Flagged ingredients</h3>
        <span className="vc-count-pill">{names.length} identified</span>
      </div>
      <ul className="vc-flag-list">
        {names.map((name, index) => (
          <li key={`${index}-${name}`}>
            <span className="vc-flag-icon" aria-hidden="true">
              <FlagIcon />
            </span>
            <span>{name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EducationalNote() {
  return (
    <aside className="vc-note" aria-labelledby="note-heading">
      <span className="vc-note-icon" aria-hidden="true">
        <InfoIcon />
      </span>
      <div>
        <h3 id="note-heading">What does this result mean?</h3>
        <p>
          Ingredient flags identify potential concerns, not a diagnosis or a guarantee of safety.
          How a product affects you also depends on its formulation and your individual sensitivity.
        </p>
      </div>
    </aside>
  );
}

export function FeedbackPanel({
  status,
  value,
  error,
  onVote,
  disabled,
}) {
  return (
    <section className="vc-feedback" aria-labelledby="feedback-heading">
      <h2 id="feedback-heading">Was this helpful?</h2>
      <p>Your feedback helps us improve VulvaCare.</p>
      <div className="vc-feedback-actions">
        <button
          type="button"
          className={`vc-btn vc-btn-outline${value === true ? ' is-selected' : ''}`}
          onClick={() => onVote(true)}
          disabled={disabled}
          aria-pressed={value === true}
        >
          Yes
        </button>
        <button
          type="button"
          className={`vc-btn vc-btn-outline${value === false ? ' is-selected' : ''}`}
          onClick={() => onVote(false)}
          disabled={disabled}
          aria-pressed={value === false}
        >
          No
        </button>
      </div>
      {status === 'submitting' ? (
        <p className="vc-feedback-status" role="status">Saving your feedback…</p>
      ) : null}
      {status === 'success' ? (
        <p className="vc-feedback-status is-success" role="status">Thank you. Your feedback was saved.</p>
      ) : null}
      {status === 'error' ? (
        <p className="vc-feedback-status is-error" role="alert">
          {error || 'Could not save feedback.'} You can try again.
        </p>
      ) : null}
    </section>
  );
}

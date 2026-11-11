import { countSubmittedIngredients, isLongInput } from '../../lib/vulvacare.js';

export default function OriginalInput({ text, inputType, expanded, onToggle }) {
  const long = isLongInput(text);
  const count = countSubmittedIngredients(text, inputType);
  const panelId = 'original-input-panel';

  return (
    <section className="vc-original" aria-labelledby="original-heading">
      <h2 id="original-heading">You gave us:</h2>
      {count ? (
        <p className="vc-original-count">{count} ingredients</p>
      ) : null}
      <div
        id={panelId}
        className={`vc-original-text${long && !expanded ? ' is-collapsed' : ''}`}
      >
        {text}
      </div>
      {long ? (
        <button
          type="button"
          className="vc-text-btn"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {expanded ? 'Hide full input' : 'Show full input'}
        </button>
      ) : null}
    </section>
  );
}

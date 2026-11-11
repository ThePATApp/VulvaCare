import { useEffect, useReducer, useRef } from 'react';
import { api } from './api.js';
import ProductChecker from './components/vulvacare/ProductChecker.jsx';
import OriginalInput from './components/vulvacare/OriginalInput.jsx';
import { EducationalNote, FeedbackPanel, ResultCard } from './components/vulvacare/ResultCard.jsx';
import { Closing, Hero, SiteFooter } from './components/vulvacare/PageChrome.jsx';
import {
  ANALYZE_ERROR_FALLBACK,
  canSubmit,
  checkerReducer,
  createRequestGuard,
  initialCheckerState,
  interpretAssessment,
  prepareAnalyzeRequest,
  scrollBehavior,
} from './lib/vulvacare.js';
import './vulvacare.css';

export default function App() {
  const [state, dispatch] = useReducer(checkerReducer, initialCheckerState);
  const inputRef = useRef(null);
  const checkerRef = useRef(null);
  const resultRef = useRef(null);
  const requests = useRef(createRequestGuard());

  useEffect(() => {
    if (state.phase !== 'success' && state.phase !== 'crisis') return;
    resultRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  }, [state.phase, state.result, state.crisisMessage]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit(state.phase)) return;

    const prepared = prepareAnalyzeRequest(state.draft);
    if (!prepared.ok) {
      dispatch({ type: 'analyze_error', error: prepared.error });
      return;
    }

    const requestId = requests.current.begin();
    if (requestId == null) return;
    dispatch({
      type: 'analyze_start',
      originalInput: prepared.originalInput,
      inputType: prepared.inputType,
    });

    try {
      const data = await api.analyze(prepared.body);
      if (!requests.current.isCurrent(requestId)) return;

      const outcome = interpretAssessment(data);
      if (outcome.kind === 'crisis') {
        requests.current.settle(requestId);
        dispatch({ type: 'analyze_crisis', message: outcome.message });
        return;
      }
      if (outcome.kind === 'error') {
        requests.current.settle(requestId);
        dispatch({ type: 'analyze_error', error: outcome.error });
        return;
      }
      if (outcome.unexpected && typeof console !== 'undefined') {
        console.warn('Unexpected analysis status from API:', outcome.result.status);
      }
      requests.current.settle(requestId);
      dispatch({ type: 'analyze_success', result: outcome.result });
    } catch (err) {
      if (!requests.current.isCurrent(requestId)) return;
      requests.current.settle(requestId);
      dispatch({
        type: 'analyze_error',
        error: err.message || ANALYZE_ERROR_FALLBACK,
      });
    }
  }

  async function handleVote(helpful) {
    const id = state.result?.id;
    if (typeof id !== 'number') {
      dispatch({
        type: 'feedback_error',
        error: 'This result cannot be rated because it was not saved.',
      });
      return;
    }
    if (state.feedbackStatus === 'submitting') return;
    if (state.feedbackStatus === 'success' && state.feedbackValue === helpful) return;

    dispatch({ type: 'feedback_start', helpful });
    try {
      await api.feedback({ id, helpful });
      dispatch({ type: 'feedback_success', helpful });
    } catch (err) {
      dispatch({
        type: 'feedback_error',
        error: err.message || 'Could not save feedback.',
      });
    }
  }

  function handleReset() {
    requests.current.invalidate();
    dispatch({ type: 'reset' });
    window.requestAnimationFrame(() => {
      checkerRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      inputRef.current?.focus();
    });
  }

  const loading = state.phase === 'loading';
  const checkerError = state.phase === 'error' ? state.error : '';
  const liveMessage = loading
    ? 'Checking ingredients…'
    : state.phase === 'success'
      ? 'Assessment ready.'
      : state.phase === 'crisis'
        ? 'Support resources are available.'
        : state.phase === 'error'
          ? state.error
          : '';

  return (
    <div className="vc">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
      <main>
        <Hero>
          <ProductChecker
            draft={state.draft}
            onDraftChange={(draft) => dispatch({ type: 'set_draft', draft })}
            onSubmit={handleSubmit}
            loading={loading}
            error={checkerError}
            inputRef={inputRef}
            formRef={checkerRef}
          />
        </Hero>

        {state.phase === 'success' && state.result ? (
          <div className="vc-results" ref={resultRef}>
            <OriginalInput
              text={state.originalInput}
              inputType={state.inputType}
              expanded={state.inputExpanded}
              onToggle={() => dispatch({ type: 'set_expanded', expanded: !state.inputExpanded })}
            />
            <ResultCard result={state.result} />
            <EducationalNote />
            <FeedbackPanel
              status={state.feedbackStatus}
              value={state.feedbackValue}
              error={state.feedbackError}
              onVote={handleVote}
              disabled={state.feedbackStatus === 'submitting'}
            />
            <button type="button" className="vc-btn vc-btn-outline vc-reset" onClick={handleReset}>
              Check another product
            </button>
          </div>
        ) : null}

        {state.phase === 'crisis' ? (
          <div className="vc-results" ref={resultRef}>
            <section className="vc-crisis" role="alert" aria-labelledby="crisis-heading">
              <h2 id="crisis-heading">Please reach out for help</h2>
              <p>{state.crisisMessage}</p>
            </section>
            <button type="button" className="vc-btn vc-btn-outline vc-reset" onClick={handleReset}>
              Check another product
            </button>
          </div>
        ) : null}
      </main>
      <Closing />
      <SiteFooter />
    </div>
  );
}

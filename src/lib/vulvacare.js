export const MAX_USER_INPUT = 5000;

export const STATUS_META = {
  caution: {
    label: 'Caution',
    visuallyHidden: 'Caution',
    className: 'caution',
  },
  lower_concern: {
    label: 'Lower concern',
    visuallyHidden: 'Lower concern',
    className: 'lower-concern',
  },
  unknown: {
    label: 'Unknown',
    visuallyHidden: 'Unknown',
    className: 'unknown',
  },
};

const INCOMPLETE_ASSESSMENT = 'The assessment was incomplete. Please try again.';
const CRISIS_FALLBACK = 'Please contact emergency services or call or text 988.';

export const ANALYZE_ERROR_FALLBACK = 'We could not check those ingredients. Please try again.';

/**
 * POST /api/analyze requires inputType. The backend stores that value and
 * does not classify the text itself. Two or more lines count as a list even
 * when they contain no commas; a single comma-separated line does too.
 * Anything else is sent as a product name.
 */
export function inferInputType(text) {
  const trimmed = String(text ?? '').trim();
  const lines = trimmed.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2) return 'ingredients';
  const commaParts = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) return 'ingredients';
  return 'product';
}

export function canSubmit(phase) {
  return phase !== 'loading';
}

export function prepareAnalyzeRequest(draft) {
  const validation = validateUserInput(draft);
  if (!validation.ok) return { ok: false, error: validation.error };
  const originalInput = typeof draft === 'string' ? draft : String(draft ?? '');
  const inputType = inferInputType(originalInput);
  return {
    ok: true,
    originalInput,
    inputType,
    body: { inputType, userInput: originalInput },
  };
}

export function interpretAssessment(data) {
  if (data?.crisis === true) {
    const message = typeof data.message === 'string' && data.message.trim()
      ? data.message
      : CRISIS_FALLBACK;
    return { kind: 'crisis', message };
  }

  const saved = typeof data?.id === 'number' && Number.isFinite(data.id);
  const hasCopy = typeof data?.status === 'string' && data.status
    && typeof data?.headline === 'string' && data.headline
    && typeof data?.explanation === 'string' && data.explanation;
  if (!saved || !hasCopy) {
    return { kind: 'error', error: INCOMPLETE_ASSESSMENT };
  }

  return {
    kind: 'success',
    unexpected: !Object.hasOwn(STATUS_META, data.status),
    result: {
      id: data.id,
      inputType: data.inputType,
      status: data.status,
      headline: data.headline,
      explanation: data.explanation,
      flaggedIngredients: Array.isArray(data.flaggedIngredients) ? data.flaggedIngredients : [],
    },
  };
}

export function createRequestGuard() {
  let current = 0;
  let busy = false;
  return {
    begin() {
      if (busy) return null;
      busy = true;
      current += 1;
      return current;
    },
    isCurrent(id) {
      return id === current;
    },
    settle(id) {
      if (id === current) busy = false;
    },
    invalidate() {
      current += 1;
      busy = false;
    },
  };
}

export function validateUserInput(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Type a product name or ingredient list first.' };
  }
  if (trimmed.length > MAX_USER_INPUT) {
    return {
      ok: false,
      error: `Keep your product name or ingredient list under ${MAX_USER_INPUT} characters.`,
    };
  }
  return { ok: true, userInput: trimmed };
}

export function flaggedNames(flaggedIngredients) {
  if (!Array.isArray(flaggedIngredients)) return [];
  return flaggedIngredients.filter((item) => typeof item === 'string' && item.trim());
}

export function getStatusMeta(status) {
  return STATUS_META[status] ?? {
    label: 'Assessment',
    visuallyHidden: 'Assessment result',
    className: 'unknown',
    unexpected: true,
  };
}

export function isLongInput(text) {
  const value = String(text ?? '');
  const lines = value.split('\n');
  return lines.length > 3 || value.length > 180;
}

export function countSubmittedIngredients(text, inputType) {
  if (inputType !== 'ingredients') return null;
  const trimmed = String(text ?? '').trim();
  const lines = trimmed.split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2 && lines.every((line) => !line.includes(','))) {
    return lines.length;
  }
  return null;
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

export const initialCheckerState = {
  draft: '',
  originalInput: '',
  inputType: null,
  phase: 'idle',
  result: null,
  error: '',
  crisisMessage: '',
  inputExpanded: false,
  feedbackStatus: 'idle',
  feedbackValue: null,
  feedbackError: '',
};

export function checkerReducer(state, action) {
  switch (action.type) {
    case 'set_draft':
      return { ...state, draft: action.draft };
    case 'set_expanded':
      return { ...state, inputExpanded: action.expanded };
    case 'analyze_start':
      return {
        ...state,
        phase: 'loading',
        error: '',
        crisisMessage: '',
        result: null,
        originalInput: action.originalInput,
        inputType: action.inputType,
        inputExpanded: false,
        feedbackStatus: 'idle',
        feedbackValue: null,
        feedbackError: '',
      };
    case 'analyze_success':
      return {
        ...state,
        phase: 'success',
        result: action.result,
        error: '',
        crisisMessage: '',
      };
    case 'analyze_crisis':
      return {
        ...state,
        phase: 'crisis',
        result: null,
        crisisMessage: action.message,
        error: '',
      };
    case 'analyze_error':
      return {
        ...state,
        phase: 'error',
        result: null,
        crisisMessage: '',
        error: action.error,
      };
    case 'feedback_start':
      return {
        ...state,
        feedbackStatus: 'submitting',
        feedbackError: '',
        feedbackValue: action.helpful,
      };
    case 'feedback_success':
      return {
        ...state,
        feedbackStatus: 'success',
        feedbackValue: action.helpful,
        feedbackError: '',
      };
    case 'feedback_error':
      return {
        ...state,
        feedbackStatus: 'error',
        feedbackError: action.error,
      };
    case 'reset':
      return { ...initialCheckerState };
    default:
      return state;
  }
}

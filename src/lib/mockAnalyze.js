/**
 * Frontend-only stand-in for POST /api/analyze.
 *
 * Replace the call site in App.jsx with `api.analyze` when the real route
 * is ready. Do not route this through src/api.js or the Express server.
 *
 * TEST DATA: status, headline, explanation, and flaggedIngredients are a
 * fixed sample. They are not an ingredient assessment. originalInput is the
 * submitted text, unchanged.
 */

export const MOCK_ANALYZE_DELAY_MS = 450;

export const MOCK_ASSESSMENT = {
  status: 'unknown',
  headline: 'Mock assessment',
  explanation:
    'This is a sample response for testing the VulvaCare interface. No ingredient analysis has been performed.',
  flaggedIngredients: [],
};

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {{ userInput: string, inputType?: string }} request
 * @returns {Promise<{
 *   originalInput: string,
 *   inputType: string | null,
 *   status: string,
 *   headline: string,
 *   explanation: string,
 *   flaggedIngredients: string[],
 * }>}
 */
export async function mockAnalyze({ userInput, inputType = null } = {}, { delayMs = MOCK_ANALYZE_DELAY_MS } = {}) {
  const originalInput = typeof userInput === 'string' ? userInput : String(userInput ?? '');
  await wait(delayMs);
  return {
    originalInput,
    inputType,
    ...MOCK_ASSESSMENT,
    flaggedIngredients: [],
  };
}

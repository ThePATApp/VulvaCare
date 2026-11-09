// =============================================================
// YOUR TEAM AND PROJECT: fill this in first!
// The web page AND the AI agent both read this file, so the app
// introduces your team and the agent knows what problem it serves.
// Anything still starting with "TODO" shows up highlighted on the page.
// =============================================================

export const project = {
  teamName: 'TODO: Team Name',
  appName: 'Community Compass',
  tagline: 'Find help nearby, in plain language.',

  // One or two sentences. Who is hurting, and how?
  problemStatement:
    'TODO: Families in our neighborhood struggle to find free food, health, and youth programs because the information is scattered and hard to read.',

  // One specific person. Give them a name, an age, and a situation.
  targetUser: 'TODO: Maria, 34, a parent of two who works evenings and searches on her phone.',

  community: 'TODO: Chicago, IL',
  theme: 'TODO: Education Access / Global Health / Clean Water / Climate / Child Protection',

  // How you will know it works. Make it measurable.
  successMeasure: 'TODO: A parent can find a matching resource in under 2 minutes.',

  teamMembers: [
    { name: 'TODO', role: 'Product owner (writes tickets)' },
    { name: 'TODO', role: 'Front end (React)' },
    { name: 'TODO', role: 'Back end (API + database)' },
    { name: 'TODO', role: 'AI agent and skills' },
  ],

  // The personality of your AI agent. Used in its system prompt.
  agent: {
    name: 'Compass',
    voice: 'warm, encouraging, and plain-spoken, like a helpful neighbor',
    readingLevel: '6th grade',
  },
};

// True if a value still needs to be filled in.
export const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO');

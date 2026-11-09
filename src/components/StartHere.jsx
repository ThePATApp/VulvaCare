import { project, isTodo } from '../../shared/project.config.js';

// A live checklist: it ticks itself as your team finishes setup.
export default function StartHere({ health }) {
  const steps = [
    { done: !isTodo(project.teamName) && !isTodo(project.problemStatement), text: 'Fill in your team and problem in shared/project.config.js' },
    { done: health?.ai === 'live', text: 'Add GEMINI_API_KEY in Replit Secrets, then restart' },
    { done: health?.database === 'postgres', text: 'Create a Postgres database in Replit (Tools > Database)' },
    { done: false, text: 'Write your first Gherkin ticket in tickets/ (see docs/SPEC-DRIVEN-DEVELOPMENT.md)' },
    { done: false, text: 'Replace the sample resources with real, verified ones' },
  ];
  const finished = steps.filter((s) => s.done).length;

  return (
    <section className="card start-here" aria-labelledby="start-title">
      <div className="card-head">
        <h2 id="start-title">Start here</h2>
        <span className="count">{finished} / {steps.length}</span>
      </div>
      <ol className="checklist">
        {steps.map((step) => (
          <li key={step.text} className={step.done ? 'done' : ''}>
            <span className="box" aria-hidden="true">{step.done ? '✓' : ''}</span>
            <span>{step.text}</span>
            <span className="sr-only">{step.done ? '(done)' : '(to do)'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

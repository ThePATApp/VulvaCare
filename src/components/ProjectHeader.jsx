import { project, isTodo } from '../../shared/project.config.js';

// Shows your team and problem statement. Edit shared/project.config.js to change it.
function Field({ value, className = '' }) {
  return <span className={`${className} ${isTodo(value) ? 'todo' : ''}`}>{value}</span>;
}

export default function ProjectHeader({ health }) {
  return (
    <header className="hero">
      <div className="hero-inner">
        <p className="eyebrow">
          <Field value={project.teamName} /> · <Field value={project.community} />
        </p>
        <h1>{project.appName}</h1>
        <p className="tagline">{project.tagline}</p>
        <div className="problem">
          <h2>The problem we're solving</h2>
          <p><Field value={project.problemStatement} /></p>
          <p className="for"><strong>For:</strong> <Field value={project.targetUser} /></p>
        </div>
        <div className="pills" aria-label="Setup status">
          <StatusPill label="AI" ok={health?.ai === 'live'} good="Gemini live" bad="Mock mode" loading={!health} />
          <StatusPill label="Database" ok={health?.database === 'postgres'} good="Postgres" bad="Sample data (memory)" loading={!health} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({ label, ok, good, bad, loading }) {
  const state = loading ? 'loading' : ok ? 'ok' : 'warn';
  return (
    <span className={`pill ${state}`}>
      <span className="dot" aria-hidden="true" /> {label}: {loading ? 'checking...' : ok ? good : bad}
    </span>
  );
}

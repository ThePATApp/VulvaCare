// Shows every skill in skills/. Add a folder there and it appears here after a restart.
export default function SkillsPanel({ skills }) {
  return (
    <section className="card skills" aria-labelledby="skills-title">
      <div className="card-head">
        <h2 id="skills-title">Agent skills</h2>
        <span className="count">{skills.length} loaded</span>
      </div>
      <ul className="skill-grid">
        {skills.map((s) => (
          <li key={s.name}>
            <code>{s.name}</code>
            {s.hasTool && <span className="tool-badge">has code</span>}
            <p>{s.description}</p>
          </li>
        ))}
      </ul>
      <p className="hint">Each skill is a folder: <code>skills/&lt;name&gt;/SKILL.md</code>, plus an optional <code>tool.js</code>.</p>
    </section>
  );
}

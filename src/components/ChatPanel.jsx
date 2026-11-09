import { useRef, useState } from 'react';
import { api } from '../api.js';
import { project } from '../../shared/project.config.js';

// Chat with your agent. Pick a skill, or leave it on Auto and let intent-router choose.
export default function ChatPanel({ skills }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [skill, setSkill] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const logRef = useRef(null);

  const choosable = skills.filter((s) => !['safety-guardrail', 'intent-router'].includes(s.name));

  async function send(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError('');
    setInput('');
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setBusy(true);
    try {
      const data = await api.chat({ message: text, skill, history });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply, meta: data }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight }));
    }
  }

  return (
    <section className="card chat" aria-labelledby="chat-title">
      <div className="card-head">
        <h2 id="chat-title">Ask {project.agent.name}</h2>
        <label className="skill-pick">
          Skill
          <select value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="auto">Auto (intent-router picks)</option>
            {choosable.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="chat-log" ref={logRef} aria-live="polite">
        {messages.length === 0 && (
          <li className="empty">Try: "Where can my kids get homework help?" or "Explain this notice in plain words."</li>
        )}
        {messages.map((m, i) => (
          <li key={i} className={`bubble ${m.role}`}>
            {/* React escapes text automatically, so AI output can't inject HTML */}
            <p><RichText text={m.text} /></p>
            {m.meta && (
              <small>
                skill: <b>{m.meta.skill}</b> · picked by {m.meta.routedBy}
                {m.meta.flags?.length ? ` · flags: ${m.meta.flags.join(', ')}` : ''}
              </small>
            )}
          </li>
        ))}
        {busy && <li className="bubble assistant thinking">{project.agent.name} is thinking...</li>}
      </ul>

      <form className="chat-form" onSubmit={send}>
        <label htmlFor="chat-input" className="sr-only">Your question</label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about food, health, youth programs..."
          maxLength={2000}
          autoComplete="off"
        />
        <button type="submit" disabled={busy}>Send</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

// Shows **bold** from the AI as real bold text. React still escapes everything,
// so this is safe: we never use dangerouslySetInnerHTML.
function RichText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

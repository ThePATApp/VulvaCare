import { useEffect, useState } from 'react';
import { api } from './api.js';
import ProjectHeader from './components/ProjectHeader.jsx';
import StartHere from './components/StartHere.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import ResourceBoard from './components/ResourceBoard.jsx';
import SkillsPanel from './components/SkillsPanel.jsx';

export default function App() {
  const [health, setHealth] = useState(null);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
    api.skills().then((data) => setSkills(data.skills)).catch(() => setSkills([]));
  }, []);

  return (
    <>
      <ProjectHeader health={health} />
      <main className="layout">
        <StartHere health={health} />
        <ChatPanel skills={skills} />
        <ResourceBoard />
        <SkillsPanel skills={skills} />
      </main>
      <footer className="footer">
        Built for the CodeSquad AI Community Sprint. Answers come from AI and can be wrong. Never share personal information.
      </footer>
    </>
  );
}

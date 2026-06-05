import React from 'react';
import { createRoot } from 'react-dom/client';

import './styles.css';

function App(): JSX.Element {
  return (
    <main className="shell">
      <header>
        <p className="eyebrow">OrgTrace</p>
        <h1>Impact analysis</h1>
      </header>
      <section className="panel">
        <p>Select a Salesforce metadata component to inspect local references and change risk.</p>
      </section>
    </main>
  );
}

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<App />);
}

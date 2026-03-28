import React from 'react';
import { VOCABULARY } from './data/vocabulary';

export default function App() {
  return (
    <div style={{ padding: 20, fontFamily: 'serif' }}>
      <h1>Greek Vocab Trainer — loading...</h1>
      <p>Words loaded: {VOCABULARY.length}</p>
    </div>
  );
}

import * as React from 'react';
import { EmbeddingSection } from 'bookmark-design-system';

function Canvas({ children }: { children: React.ReactNode }) {
  return <div style={{ background: '#0a0a0b', padding: 24, width: 460 }}>{children}</div>;
}

export function Collapsed() {
  return (
    <Canvas>
      <EmbeddingSection
        expanded={false}
        embedProvider="ollama"
        embedModel="nomic-embed-text-v2-moe"
        onEmbedProvider={() => {}}
        onEmbedModel={() => {}}
        onCustomize={() => {}}
        onToggleExpanded={() => {}}
      />
    </Canvas>
  );
}

export function Expanded() {
  return (
    <Canvas>
      <EmbeddingSection
        expanded
        embedProvider="openai"
        embedModel="text-embedding-3-small"
        onEmbedProvider={() => {}}
        onEmbedModel={() => {}}
        onCustomize={() => {}}
        onToggleExpanded={() => {}}
      />
    </Canvas>
  );
}

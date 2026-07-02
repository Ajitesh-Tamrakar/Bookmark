import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SetupDoneScreen } from 'bookmark-design-system';

// SetupDoneScreen calls useNavigate() and auto-redirects after a 3s countdown —
// it needs a Router context to render at all. A MemoryRouter here is scoped to
// this preview only; the redirect itself doesn't fire before the screenshot.
export function Basic() {
  return (
    <MemoryRouter initialEntries={['/setup/done']}>
      <SetupDoneScreen embedModel="nomic-embed-text-v2-moe" genModel="qwen2.5:7b" whisper="base" devMode={false} />
    </MemoryRouter>
  );
}

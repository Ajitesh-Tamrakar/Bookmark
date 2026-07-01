import Spinner from './Spinner';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-success shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 8.5l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-error shrink-0">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PendingIcon() {
  return <span className="shrink-0 inline-block w-[6px] h-[6px] rounded-full bg-text-faint opacity-40 mx-[5px]" />;
}

export default function StatusIcon({ status }) {
  if (status === 'ok') return <CheckIcon />;
  if (status === 'error') return <ErrorIcon />;
  if (status === 'running' || status === 'progress') return <Spinner size={16} />;
  return <PendingIcon />;
}

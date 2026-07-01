export default function Spinner({ size = 16, className = '' }) {
  return (
    <span
      className={`animate-spin shrink-0 inline-block rounded-full border-2 border-text-faint border-t-text-secondary ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

import { cn } from '../utils';

function Table({ children, className = '' }) {
  return (
    <div className={cn('border border-border-faint bg-bg-panel-strong rounded-xl overflow-hidden', className)}>
      {children}
    </div>
  );
}

function Head({ columns, children }) {
  return (
    <div
      className="grid items-center gap-[14px] px-4 py-[9px] border-b border-border-faint bg-bg-panel"
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}

function HeadCell({ children, align = 'left' }) {
  return (
    <div
      className={cn(
        'font-mono text-[10px] tracking-[0.12em] uppercase text-text-faint',
        align === 'right' && 'text-right'
      )}
    >
      {children}
    </div>
  );
}

function Row({ columns, children, className = '' }) {
  return (
    <div
      className={cn('grid items-center gap-[14px] px-4 py-[13px] border-b border-border-faintest last:border-b-0', className)}
      style={{ gridTemplateColumns: columns }}
    >
      {children}
    </div>
  );
}

function EmptyRow({ children }) {
  return (
    <div className="px-4 py-7 text-center font-mono text-[12.5px] text-text-disabled">
      {children}
    </div>
  );
}

Table.Head = Head;
Table.HeadCell = HeadCell;
Table.Row = Row;
Table.EmptyRow = EmptyRow;

export default Table;

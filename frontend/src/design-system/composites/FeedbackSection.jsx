import { useState, useEffect } from 'react';
import SectionHeader from '../primitives/SectionHeader';
import Modal from '../primitives/Modal';
import Button from '../primitives/Button';
import IconButton from '../primitives/IconButton';
import Select from '../primitives/Select';
import { cn } from '../utils';
import { BUCKET_ORDER, BUCKET_LABELS } from '../retrievalUtils';

const GRID = '1fr 70px 1fr 110px 200px';

const BUCKET_OPTIONS = BUCKET_ORDER.map((value) => ({ value, label: BUCKET_LABELS[value] }));

function fmtAgo(iso) {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function FeedbackSection({ feedback, onRowResolved }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [addModalFor, setAddModalFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookmarkId, setSelectedBookmarkId] = useState(null);
  const [bucket, setBucket] = useState('paraphrase');

  useEffect(() => {
    fetch('/retrieve/bookmarks/')
      .then((res) => res.json())
      .then((json) => setBookmarks(json.results || []))
      .catch(() => {});
  }, []);

  const openAddModal = (row) => {
    setAddModalFor(row.id);
    setSearchQuery('');
    setSelectedBookmarkId(null);
    setBucket('paraphrase');
  };
  const closeAddModal = () => setAddModalFor(null);

  const confirmAdd = async () => {
    if (!addModalFor || !selectedBookmarkId) return;
    try {
      const res = await fetch(`/evaluate/feedback/${addModalFor}/promote/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expected_bookmark_id: selectedBookmarkId, bucket }),
      });
      if (!res.ok) return;
      onRowResolved(addModalFor);
      setAddModalFor(null);
    } catch {
      // best-effort — modal stays open so the user can retry
    }
  };

  const dismiss = async (id) => {
    try {
      const res = await fetch(`/evaluate/feedback/${id}/dismiss/`, { method: 'POST' });
      if (!res.ok) return;
      onRowResolved(id);
    } catch {
      // best-effort
    }
  };

  const addModalRow = feedback.rows.find((f) => f.id === addModalFor) || null;
  const filteredBookmarks = bookmarks
    .filter((b) => (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 6);

  return (
    <section id="feedback" className="scroll-mt-14">
      <SectionHeader
        eyebrow="Feedback"
        title="Live feedback queue"
        description={'Real searches marked "not what I expected." Promote the good ones into the golden set.'}
      />
      <div className="flex items-center gap-2 mt-4 mb-4 font-mono text-text-muted text-[12px]">
        <span>{feedback.total_searches} searches logged</span>
        <span className="text-text-faint">·</span>
        <span className="text-accent-success">{Math.round(feedback.yes_pct)}% yes</span>
        <span className="text-text-faint">·</span>
        <span className="text-accent-error">{Math.round(feedback.no_pct)}% no</span>
      </div>

      {feedback.rows.length === 0 ? (
        <div className="border border-dashed border-border-default rounded-2xl px-8 py-[54px] text-center flex flex-col items-center gap-1.5">
          <div className="w-[46px] h-[46px] rounded-[13px] border border-border-default bg-bg-raised flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16M4 12h16M4 19h16" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-text-primary font-semibold text-[17px] tracking-tight">No feedback to review yet</div>
        </div>
      ) : (
        <div className="border border-border-faint bg-bg-panel-strong rounded-xl overflow-hidden">
          <div className="grid items-center gap-3 px-3.5 py-[9px] border-b border-border-faint bg-bg-panel" style={{ gridTemplateColumns: GRID }}>
            <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Query</span>
            <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Timestamp</span>
            <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Shown result</span>
            <span className="font-mono text-text-faint text-[10px] tracking-[0.12em] uppercase">Clicked</span>
            <span />
          </div>
          {feedback.rows.map((fb) => (
            <div key={fb.id} className="grid items-center gap-3 px-3.5 py-3 border-b border-border-faintest last:border-b-0" style={{ gridTemplateColumns: GRID }}>
              <span className="text-text-secondary text-[12.5px]">{fb.query_text}</span>
              <span className="font-mono text-text-faint text-[11px]">{fmtAgo(fb.searched_at)}</span>
              <span className="text-text-muted text-[12px]">{fb.shown_title || '(deleted)'}</span>
              <span className="font-mono text-text-muted text-[11px]">{fb.clicked_rank ? `rank ${fb.clicked_rank}` : 'nothing clicked'}</span>
              <div className="flex items-center gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => openAddModal(fb)}>Add to golden set</Button>
                <IconButton aria-label="Dismiss" onClick={() => dismiss(fb.id)}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addModalFor != null} onClose={closeAddModal} maxWidth={480}>
        <div className="px-6 py-5 border-b border-border-default">
          <div className="font-mono text-text-faint text-[11px] tracking-[0.12em] uppercase">Add to golden set</div>
          <div className="text-text-secondary text-[14px] mt-2">{addModalRow ? `"${addModalRow.query_text}"` : ''}</div>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-text-muted font-medium text-[12px]">Correct bookmark</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks…"
              className="w-full box-border bg-bg-sunken border border-border-default text-text-primary rounded-lg px-3 py-2 text-[13px] outline-none"
            />
            <div className="flex flex-col gap-1 mt-1">
              {filteredBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => setSelectedBookmarkId(bm.id)}
                  className={cn(
                    'px-3 py-[7px] rounded-[7px] text-[12.5px] cursor-pointer',
                    selectedBookmarkId === bm.id ? 'bg-bg-hover-strong text-text-primary' : 'text-text-secondary hover:bg-bg-hover'
                  )}
                >
                  {bm.title || '(untitled)'}
                </div>
              ))}
            </div>
          </div>
          <Select label="Bucket" options={BUCKET_OPTIONS} value={bucket} onChange={(e) => setBucket(e.target.value)} />
        </div>
        <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={closeAddModal}>Cancel</Button>
          <Button variant="primary" disabled={!selectedBookmarkId} onClick={confirmAdd}>Confirm</Button>
        </div>
      </Modal>
    </section>
  );
}

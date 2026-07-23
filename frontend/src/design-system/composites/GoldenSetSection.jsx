import { useState, useRef } from 'react';
import SectionHeader from '../primitives/SectionHeader';
import Card from '../primitives/Card';
import Modal from '../primitives/Modal';
import Button from '../primitives/Button';
import Spinner from '../primitives/Spinner';
import { shortDate, shortHash } from '../retrievalUtils';

export default function GoldenSetSection({ activeGoldenSet, onConfirmed }) {
  const [stage, setStage] = useState('idle'); // 'idle' | 'parsing' | 'preview'
  const [preview, setPreview] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const uploadFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setStage('parsing');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/evaluate/golden-set/upload/', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setStage('idle');
        setUploadError(json?.error || 'Upload failed.');
        return;
      }
      setPreview(json);
      setStage('preview');
    } catch {
      setStage('idle');
      setUploadError('Upload failed.');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    uploadFile(e.dataTransfer.files?.[0]);
  };

  const onFileChange = (e) => {
    uploadFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const cancelGoldenSet = () => {
    setStage('idle');
    setPreview(null);
  };

  const confirmGoldenSet = async () => {
    try {
      const res = await fetch('/evaluate/golden-set/confirm/', { method: 'POST' });
      if (!res.ok) return;
      setStage('idle');
      setPreview(null);
      onConfirmed();
    } catch {
      // best-effort — modal stays open so the user can retry
    }
  };

  const hasEntries = activeGoldenSet && activeGoldenSet.entry_count > 0;

  return (
    <section id="goldenset" className="scroll-mt-14">
      <SectionHeader eyebrow="Golden set" title="Upload a new golden set" />
      <Card variant="panel" className="mt-5">
        <div
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border border-dashed border-border-default rounded-xl px-6 py-9 text-center cursor-pointer transition-colors hover:border-border-strong"
        >
          {stage === 'parsing' ? (
            <div className="flex flex-col items-center gap-3">
              <Spinner size={20} />
              <div className="font-mono text-text-muted text-[12px]">Parsing golden-set.csv…</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="var(--color-icon-muted)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="text-text-secondary text-[13.5px] mt-1">
                Drop a golden-set <span className="font-mono text-text-primary">.csv</span> file here, or click to browse
              </div>
              <div className="font-mono text-text-faint text-[11px]">query, expected_bookmark_id, bucket</div>
              {uploadError && <div className="font-mono text-accent-error text-[11px] mt-1">{uploadError}</div>}
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept=".csv" onChange={onFileChange} className="hidden" />

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-faintest">
          <span className="font-mono text-text-faint text-[11px] tracking-[0.1em] uppercase">Active version</span>
          {hasEntries ? (
            <div className="font-mono text-text-secondary flex items-center gap-3 text-[12px]">
              <span>{shortHash(activeGoldenSet.fingerprint)}</span>
              <span className="text-text-faint">·</span>
              <span>{activeGoldenSet.entry_count} entries</span>
              <span className="text-text-faint">·</span>
              <span>{shortDate(activeGoldenSet.last_updated)}</span>
            </div>
          ) : (
            <span className="font-mono text-text-faint text-[12px]">No active golden set yet</span>
          )}
        </div>
      </Card>

      <Modal open={stage === 'preview'} onClose={cancelGoldenSet} maxWidth={640}>
        <div className="px-6 py-5 border-b border-border-default">
          <div className="font-mono text-text-faint text-[11px] tracking-[0.12em] uppercase">Golden set preview</div>
          <div className="text-text-primary font-semibold text-[17px] mt-1">{preview?.total ?? 0} entries parsed</div>
        </div>
        <div className="px-6 py-4 max-h-[340px] overflow-auto">
          {preview?.errors?.length > 0 && (
            <div className="mb-4 flex flex-col gap-1">
              {preview.errors.map((err, i) => (
                <div key={i} className="text-accent-error font-mono text-[12px]">⚠ {err}</div>
              ))}
            </div>
          )}
          <div className="border border-border-faintest rounded-[10px] overflow-hidden">
            <div className="grid gap-3.5 px-3 py-2 bg-bg-panel" style={{ gridTemplateColumns: '1fr 1fr 100px' }}>
              <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Query</span>
              <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Expected bookmark id</span>
              <span className="font-mono text-text-faint text-[9.5px] tracking-[0.1em] uppercase">Bucket</span>
            </div>
            {(preview?.preview_entries ?? []).map((pe, i) => (
              <div key={i} className="grid gap-3.5 px-3 py-2 border-t border-border-faintest" style={{ gridTemplateColumns: '1fr 1fr 100px' }}>
                <span className="text-text-secondary text-[12px]">{pe.query}</span>
                <span className="font-mono text-text-muted text-[11.5px]">{pe.expected_bookmark_id}</span>
                <span className="font-mono text-text-faint text-[10.5px]">{pe.bucket}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={cancelGoldenSet}>Cancel</Button>
          <Button variant="primary" onClick={confirmGoldenSet}>Save as new version</Button>
        </div>
      </Modal>
    </section>
  );
}

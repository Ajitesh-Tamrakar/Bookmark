import Modal from '../primitives/Modal';
import Button from '../primitives/Button';

export default function SetupCompleteModal({ open, embedModel, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth={420}>
      <div className="px-6 pt-6 pb-5">
        <h3 className="text-[18px] font-semibold text-text-primary mb-2 tracking-tight">
          Lock in your setup?
        </h3>
        <p className="text-[13px] text-text-muted leading-relaxed mb-1">
          Your embedding model will be permanently locked to:
        </p>
        <p className="font-mono text-[13px] text-accent-warning-text mt-1 mb-4 bg-accent-warning/8 px-3 py-2 rounded-[6px] border border-accent-warning/20">
          {embedModel}
        </p>
        <p className="text-[13px] text-text-muted leading-relaxed">
          This cannot be changed without clearing all saved bookmarks. All other settings can be
          updated later.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 pb-5">
        <Button variant="ghost" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" size="md" onClick={onConfirm}>
          Lock &amp; complete
        </Button>
      </div>
    </Modal>
  );
}

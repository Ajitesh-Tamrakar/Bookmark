import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';

export default function SetupCompleteModal({ open, embedModel, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <ModalDialog
        sx={{
          maxWidth: 420,
          bgcolor: '#121116',
          border: '1px solid #232228',
          borderRadius: '14px',
          p: 0,
          overflow: 'hidden',
        }}
      >
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-[18px] font-semibold text-text-primary mb-2 tracking-tight">
            Lock in your setup?
          </h3>
          <p className="text-[13px] text-text-muted leading-relaxed mb-1">
            Your embedding model will be permanently locked to:
          </p>
          <p className="font-mono text-[13px] text-accent-warning-text mt-1 mb-4 bg-accent-warning/[0.08] px-3 py-2 rounded-[6px] border border-accent-warning/20">
            {embedModel}
          </p>
          <p className="text-[13px] text-text-muted leading-relaxed">
            This cannot be changed without clearing all saved bookmarks. All other settings can be
            updated later.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] font-medium text-text-muted hover:text-text-secondary px-4 py-[8px] rounded-[8px] border border-border-default hover:border-border-strong transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-[13px] font-medium text-bg-base bg-text-primary hover:opacity-90 px-4 py-[8px] rounded-[8px] transition-opacity cursor-pointer"
          >
            Lock &amp; complete
          </button>
        </div>
      </ModalDialog>
    </Modal>
  );
}

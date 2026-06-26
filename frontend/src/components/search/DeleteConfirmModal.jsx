import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';

export default function DeleteConfirmModal({ open, title, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <ModalDialog
        sx={{
          background: '#121116',
          border: '1px solid #2a2930',
          borderRadius: '15px',
          padding: '26px',
          maxWidth: '430px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ededee', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
          Delete this bookmark?
        </h3>
        <p style={{ fontSize: '13.5px', color: '#9a98a3', lineHeight: 1.55, margin: '0 0 22px' }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", color: '#ededee' }}>{title}</span>{' '}
          will be permanently removed, along with its embeddings and tags. This can&apos;t be undone.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            className="bg-transparent border border-border-default text-text-secondary font-sans text-[13px] font-medium cursor-pointer px-[18px] py-[10px] rounded-[8px] hover:border-border-strong transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-accent-error text-bg-base border-none font-sans text-[13px] font-semibold cursor-pointer px-[18px] py-[10px] rounded-[8px] hover:opacity-90 transition-opacity"
          >
            Delete permanently
          </button>
        </div>
      </ModalDialog>
    </Modal>
  );
}

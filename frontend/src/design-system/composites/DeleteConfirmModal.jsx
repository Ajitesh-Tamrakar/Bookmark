import Modal from '../primitives/Modal';
import Button from '../primitives/Button';

export default function DeleteConfirmModal({ open, title, onCancel, onConfirm }) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth={430}>
      <div className="p-[26px]">
        <h3 className="text-[18px] font-semibold text-text-primary mb-[10px] tracking-tight">
          Delete this bookmark?
        </h3>
        <p className="text-[13.5px] text-text-muted leading-relaxed mb-[22px]">
          <span className="font-mono text-text-primary">{title}</span>{' '}
          will be permanently removed, along with its embeddings and tags. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-[10px]">
          <Button variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm}>
            Delete permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}

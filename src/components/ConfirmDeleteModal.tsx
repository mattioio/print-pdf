import Modal from './Modal';

export default function ConfirmDeleteModal({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose}>
      <div className="p-6">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4h12M5.5 4V2.5a1 1 0 011-1h3a1 1 0 011 1V4M3.5 4l.75 9a1.5 1.5 0 001.5 1.5h4.5a1.5 1.5 0 001.5-1.5l.75-9" />
            <path d="M6.5 7v4M9.5 7v4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Delete brochure</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <strong>{name || 'Untitled'}</strong>? This can't be undone.
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

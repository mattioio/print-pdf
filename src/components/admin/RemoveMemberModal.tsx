import { useState } from 'react';
import { adminApi, type Member } from '../../lib/adminApi';
import Modal from '../Modal';

export default function RemoveMemberModal({
  member,
  orgId,
  onClose,
  onRemoved,
}: {
  member: Member;
  orgId: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    setError('');
    setSubmitting(true);
    try {
      await adminApi.removeMember(member.id, orgId);
      onRemoved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="px-6 pt-5 pb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Remove Member</h3>
        <p className="text-sm text-gray-500 mb-4">
          Are you sure you want to remove{' '}
          <span className="font-medium text-gray-700">{member.name}</span>{' '}
          <span className="text-gray-400">({member.email})</span>{' '}
          from this company?
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Their account won't be deleted, but they'll lose access to this company's brochures.
        </p>

        {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRemove}
            disabled={submitting}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

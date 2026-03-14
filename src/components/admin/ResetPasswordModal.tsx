import { useState } from 'react';
import { adminApi, type Member } from '../../lib/adminApi';
import Modal from '../Modal';

export default function ResetPasswordModal({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await adminApi.resetPassword(member.id, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md">
      <div className="px-6 pt-5 pb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Reset Password</h3>
        <p className="text-sm text-gray-500 mb-4">
          Reset password for <span className="font-medium text-gray-700">{member.name}</span>{' '}
          <span className="text-gray-400">({member.email})</span>
        </p>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 mx-auto mb-2">
              <polyline points="2 8 6 12 14 4" />
            </svg>
            <p className="text-sm font-medium text-green-800">Password reset successfully</p>
            <p className="text-xs text-green-600 mt-1">
              They'll be asked to set a new password on their next login.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <div className="flex gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3M8 10.5v.5" />
                </svg>
                <p className="text-xs text-amber-700">
                  This will immediately change their password. They'll be required to set a new one on their next login.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="block text-xs font-medium text-gray-500 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoFocus
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

              <div className="flex gap-2 justify-end mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || password.length < 8}
                  className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

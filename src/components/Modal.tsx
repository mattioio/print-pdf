/**
 * Shared modal shell — scrim + centered dialog with animation.
 * Replaces duplicated modal markup across Admin and Dashboard.
 */
export default function Modal({
  open,
  onClose,
  size = 'sm',
  children,
}: {
  open: boolean;
  onClose: () => void;
  size?: 'sm' | 'md';
  children: React.ReactNode;
}) {
  if (!open) return null;
  const maxW = size === 'md' ? 'max-w-md' : 'max-w-sm';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full ${maxW} mx-4 overflow-hidden`}
        style={{ animation: 'userMenuIn 0.15s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

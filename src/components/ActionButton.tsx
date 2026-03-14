/**
 * Small action button — compact variant of the primary button.
 * Used on cards across Dashboard and Admin.
 *
 * Two button system:
 *   Primary (big):  px-5 py-2.5 bg-amber-500 text-white rounded-lg
 *   Small (this):   px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md
 */
export default function ActionButton({
  icon,
  label,
  variant = 'secondary',
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: 'secondary' | 'danger';
  hoverColor?: string; // kept for backward compat — ignored
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
}) {
  const base =
    'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  const styles = {
    secondary:
      'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:hover:bg-gray-100',
    danger:
      'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:hover:bg-gray-100 disabled:hover:text-gray-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles[variant]}`}
    >
      {icon}
      {label}
    </button>
  );
}

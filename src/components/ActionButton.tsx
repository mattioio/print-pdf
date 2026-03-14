/**
 * Shared pill-style icon button used on cards across Dashboard and Admin.
 * Consolidates the duplicated "bg-black/5 hover:bg-{color}" button pattern.
 */
export default function ActionButton({
  icon,
  label,
  hoverColor = 'hover:bg-gray-600',
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  hoverColor?: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 bg-black/5 ${hoverColor} text-gray-400 hover:text-white rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black/5 disabled:hover:text-gray-400`}
    >
      {icon}
      {label}
    </button>
  );
}

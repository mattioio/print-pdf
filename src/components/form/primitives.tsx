/** Shared form primitives used across all form sections. */

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mt-2 -mb-2 px-1">
      {children}
    </h3>
  );
}

export function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-100 p-4 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-y"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

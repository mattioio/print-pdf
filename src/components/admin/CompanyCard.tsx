import type { Company } from '../../lib/adminApi';
import CompanyDetail from './CompanyDetail';

export default function CompanyCard({
  company,
  expanded,
  onToggle,
}: {
  company: Company;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{company.agency_name || company.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {company.template_count} template{company.template_count !== 1 ? 's' : ''}
            {' \u00b7 '}
            {company.member_count} {company.member_count === 1 ? 'person' : 'people'}
            {' \u00b7 '}
            {new Date(company.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="3 5 7 9 11 5" />
        </svg>
      </button>

      {expanded && <CompanyDetail orgId={company.id} />}
    </div>
  );
}

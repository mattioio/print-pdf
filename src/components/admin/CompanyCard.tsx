import type { Company } from '../../lib/adminApi';

export default function CompanyCard({
  company,
  onSelect,
}: {
  company: Company;
  onSelect: () => void;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all group"
      onClick={onSelect}
    >
      <div className="flex items-center gap-4 px-5 py-3.5">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {company.agency_name || company.name}
          </h3>

          {/* Meta pills */}
          <div className="flex items-center gap-2 mt-2">
            {/* Templates */}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 1.5H4a1.5 1.5 0 00-1.5 1.5v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V6L9 1.5z" />
                <path d="M9 1.5V6h4.5" />
              </svg>
              {company.template_count} template{company.template_count !== 1 ? 's' : ''}
            </span>

            {/* People */}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="5" r="2.5" />
                <path d="M3.5 14.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
              </svg>
              {company.member_count} {company.member_count === 1 ? 'person' : 'people'}
            </span>

            {/* Date */}
            <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="12" height="11" rx="1.5" />
                <path d="M2 6.5h12" />
                <path d="M5.5 1.5v3M10.5 1.5v3" />
              </svg>
              {new Date(company.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0"
        >
          <polyline points="5 3 9 7 5 11" />
        </svg>
      </div>
    </div>
  );
}

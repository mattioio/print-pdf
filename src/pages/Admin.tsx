import { useState, useEffect, useCallback } from 'react';
import { adminApi, type Company } from '../lib/adminApi';
import { useToast } from '../context/ToastContext';
import CreateCompanyForm from '../components/admin/CreateCompanyForm';
import CompanyCard from '../components/admin/CompanyCard';
import CompanyDetail from '../components/admin/CompanyDetail';
import SlidePanel from '../components/admin/SlidePanel';
import TemplatesTab from '../components/admin/TemplatesTab';

type AdminTab = 'companies' | 'templates';

interface AdminProps {
  onBack: () => void;
}

export default function Admin({ onBack }: AdminProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>('companies');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const list = await adminApi.listCompanies();
      setCompanies(list);
    } catch (err) {
      console.error('Failed to load companies:', err);
      toast('Failed to load companies', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex items-center h-14 px-6">
          <button
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            onClick={onBack}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 2 3 7 8 12" />
            </svg>
            Dashboard
          </button>
          <div className="flex-1" />
          <h1 className="text-sm font-semibold text-gray-900">Admin</h1>
          <div className="flex-1" />
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
          {(['companies', 'templates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'companies' ? 'Companies' : 'Templates'}
            </button>
          ))}
        </div>

        {tab === 'companies' ? (
          <>
            <CreateCompanyForm onCreated={reload} />

            {/* Companies List */}
            <section>
              <h2 className="text-sm font-medium text-gray-400 mb-3">
                Companies ({companies.length})
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : companies.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">No companies yet.</p>
              ) : (
                <div className="space-y-2">
                  {companies.map((c) => (
                    <CompanyCard
                      key={c.id}
                      company={c}
                      onSelect={() => setSelectedCompanyId(c.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Company detail panel */}
            <SlidePanel
              open={!!selectedCompany}
              onClose={() => setSelectedCompanyId(null)}
              title={selectedCompany?.agency_name || selectedCompany?.name || 'Company'}
            >
              {selectedCompany && (
                <CompanyDetail
                  key={selectedCompany.id}
                  orgId={selectedCompany.id}
                  onAgencyNameChange={(name) =>
                    setCompanies((prev) =>
                      prev.map((co) => co.id === selectedCompany.id ? { ...co, agency_name: name } : co),
                    )
                  }
                />
              )}
            </SlidePanel>
          </>
        ) : (
          <TemplatesTab />
        )}
      </main>
    </div>
  );
}

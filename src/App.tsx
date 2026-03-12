import { useState, useCallback, useEffect } from 'react';
import { BrochureProvider } from './context/BrochureContext';
import { createDefaultBrochure } from './utils/defaults';
import { loadBrochureWithImages, saveBrochure, migrateImagesToIndexedDB } from './utils/storage';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import type { BrochureData } from './types/brochure';

type Route =
  | { page: 'dashboard' }
  | { page: 'editor'; data: BrochureData }
  | { page: 'loading' };

export default function App() {
  const [route, setRoute] = useState<Route>({ page: 'loading' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Run one-time migration on mount, then show dashboard
  useEffect(() => {
    migrateImagesToIndexedDB().finally(() => {
      setRoute({ page: 'dashboard' });
    });
  }, []);

  const handleNew = useCallback(() => {
    const brochure = createDefaultBrochure();
    saveBrochure(brochure);
    setRoute({ page: 'editor', data: brochure });
  }, []);

  const handleEdit = useCallback(async (id: string) => {
    const brochure = await loadBrochureWithImages(id);
    if (brochure) {
      setRoute({ page: 'editor', data: brochure });
    }
  }, []);

  const handleBack = useCallback(() => {
    setRoute({ page: 'dashboard' });
  }, []);

  if (route.page === 'loading') {
    return null;
  }

  return (
    <>
      {route.page === 'editor' ? (
        <BrochureProvider initial={route.data} key={route.data.id}>
          <Editor onBack={handleBack} onSettings={() => setSettingsOpen(true)} />
        </BrochureProvider>
      ) : (
        <Dashboard
          onNew={handleNew}
          onEdit={handleEdit}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

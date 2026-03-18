import { useState, useEffect } from 'react';
import { useBrochure } from '../../../context/BrochureContext';
import { useAuth } from '../../../context/AuthContext';
import { apiCompanyAgents } from '../../../lib/api';
import { Section, SectionHeading, Label, TextArea } from '../primitives';
import type { ContactPerson } from '../../../types/brochure';

export default function ViewingsSection() {
  const { data, updateField } = useBrochure();
  const { organization } = useAuth();
  const [agents, setAgents] = useState<ContactPerson[]>([]);

  // Load agents from API
  useEffect(() => {
    const orgId = organization?.id;
    if (!orgId) return;
    apiCompanyAgents.list(orgId).then((rows) => {
      setAgents(rows.map((a) => ({ name: a.name, email: a.email })));
    }).catch(() => { /* ignore */ });
  }, [organization?.id]);

  const toggleAgent = (agent: { name: string; email: string }) => {
    const exists = data.viewings.some(
      (v) => v.name === agent.name && v.email === agent.email,
    );
    if (exists) {
      updateField(
        'viewings',
        data.viewings.filter(
          (v) => !(v.name === agent.name && v.email === agent.email),
        ),
      );
    } else {
      updateField('viewings', [...data.viewings, { ...agent }]);
    }
  };

  const isAgentSelected = (agent: { name: string; email: string }) =>
    data.viewings.some(
      (v) => v.name === agent.name && v.email === agent.email,
    );

  // Viewings entries that no longer match any current agent (stale/renamed)
  const orphanedViewings = data.viewings.filter(
    (v) => !agents.some((a) => a.name === v.name && a.email === v.email),
  );

  return (
    <>
      <SectionHeading>Viewings</SectionHeading>
      <Section>
        <div>
          <Label>Contacts</Label>
          {agents.length > 0 || orphanedViewings.length > 0 ? (
            <div className="space-y-2">
              {agents.map((agent, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isAgentSelected(agent)}
                    onChange={() => toggleAgent(agent)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{agent.email}</span>
                  </div>
                </label>
              ))}
              {orphanedViewings.map((v, i) => (
                <label
                  key={`orphan-${i}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors opacity-60"
                >
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleAgent(v)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{v.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{v.email}</span>
                    <span className="text-xs text-amber-600 ml-2">(removed agent)</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No agents configured. Add agents in Settings.
            </p>
          )}
        </div>
        <div>
          <Label>Viewings Extra Info</Label>
          <TextArea
            value={data.viewingsBlurb ?? ''}
            onChange={(v) => updateField('viewingsBlurb', v)}
            placeholder="e.g. Strictly by appointment only through the sole agents."
            rows={2}
          />
        </div>
      </Section>
    </>
  );
}

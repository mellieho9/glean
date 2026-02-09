import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { listSources } from "../utils/api";
import PageLayout from "../components/PageLayout";
import NavFooter from "../components/NavFooter";
import SchemaCard from "../components/SchemaCard";

export default function SelectSchemas() {
  const { accessToken } = useAuth();
  const { integration, setSelectedSources } = useOnboarding();
  const [sources, setSources] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    listSources(integration, accessToken)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setSources(list);
        if (list.length > 0) {
          setSelected({ [list[0].id || list[0].source_id]: true });
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [accessToken, integration]);

  const toggleSource = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Sync selected sources to onboarding context
  useEffect(() => {
    const selectedSources = sources.filter(
      (s) => selected[s.id || s.source_id]
    );
    setSelectedSources(selectedSources);
  }, [selected, sources, setSelectedSources]);

  const iconForSource = (source) => {
    const name = (source.title || source.name || "").toLowerCase();
    if (name.includes("recipe")) return "restaurant_menu";
    if (name.includes("comment")) return "forum";
    if (name.includes("place")) return "location_on";
    return "database";
  };

  return (
    <PageLayout
      center
      step={1}
      title="Select Schemas"
      description="Choose the databases you want to access from your workspace."
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full spinner" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-4">{error}</p>
      ) : sources.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No databases found in your workspace.
        </p>
      ) : (
        <div className="space-y-4">
          {sources.map((source) => {
            const id = source.id || source.source_id;
            return (
              <SchemaCard
                key={id}
                as="label"
                icon={iconForSource(source)}
                title={source.title || source.name}
                subtitle="Database"
                action={
                  <input
                    type="checkbox"
                    checked={!!selected[id]}
                    onChange={() => toggleSource(id)}
                    className="w-5 h-5 rounded text-primary focus:ring-primary accent-primary"
                  />
                }
              />
            );
          })}
        </div>
      )}

      <NavFooter
        backTo="/connect"
        nextTo="/configure"
        nextDisabled={selectedCount === 0}
      />
    </PageLayout>
  );
}

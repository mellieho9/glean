import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { connectIntegration, listConnections } from "../utils/api";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";
import SchemaCard from "../components/SchemaCard";

const INTEGRATIONS = [
  {
    slug: "notion",
    name: "Notion",
    description: "Sync video schemas to your Notion pages",
  },
];

export default function ConnectDatabases() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { setIntegration } = useOnboarding();
  const [connections, setConnections] = useState({});
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const hasConnection = Object.values(connections).some(Boolean);

  // Check existing connections on mount
  useEffect(() => {
    if (!accessToken) return;
    listConnections(accessToken)
      .then((data) => {
        const map = {};
        (data.connected || []).forEach((c) => {
          map[c.slug] = true;
        });
        setConnections(map);
      })
      .catch(() => {}); // silently fail — user can still connect
  }, [accessToken]);

  const handleConnect = async (slug) => {
    setConnecting(slug);
    setError(null);
    try {
      await connectIntegration(slug, accessToken);
      setConnections((prev) => ({ ...prev, [slug]: true }));
      setIntegration(slug);
      setTimeout(() => navigate("/select-schemas"), 400);
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <PageLayout
      center
      showAvatar
      step={0}
      title="Connect your databases"
      description="Link your data sources to get started."
    >
      <div className="grid gap-4">
        {INTEGRATIONS.map((db) => {
          const isConnected = connections[db.slug];
          const isConnecting = connecting === db.slug;

          return (
            <SchemaCard
              key={db.slug}
              as="button"
              iconElement={<NotionIcon />}
              title={db.name}
              subtitle={db.description}
              onClick={() => handleConnect(db.slug)}
              disabled={isConnected || isConnecting}
              action={
                isConnected ? (
                  <Icon name="check_circle" className="text-primary text-2xl" />
                ) : isConnecting ? (
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full spinner" />
                ) : null
              }
            />
          );
        })}

        <div className="bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-xl opacity-60">
          <div className="text-left">
            <h3 className="font-semibold text-sm">More coming soon</h3>
            <p className="text-xs text-slate-500">
              Obsidian, Google Sheets, and Airtable integrations are on the way.
            </p>
          </div>
        </div>
      </div>

      {hasConnection && (
        <div className="mt-8">
          <button
            onClick={() => {
              setIntegration(Object.keys(connections).find((k) => connections[k]) || "notion");
              navigate("/select-schemas");
            }}
            className="w-full py-4 px-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}
    </PageLayout>
  );
}

function NotionIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40" fill="#000000">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.575 7.25c.062.345-.018.68-.338.711l-.532.096l-.22 8.317c-.468.25-.894.388-1.245.375c-.567-.02-.704-.215-1.11-.795l-3.306-5.947l-.15 5.636l1.088.304s-.018.681-.9.65l-2.44.068c-.066-.155.015-.532.265-.596l.64-.169l.197-7.45l-.88-.106c-.062-.345.129-.829.622-.85l2.617-.099l3.445 6.027l.139-5.221l-.916-.147a.62.62 0 0 1 .584-.734z"/><path  fillRule="evenodd" d="M17.258 2.833a47.7 47.7 0 0 0-10.516 0c-2.012.225-3.637 1.81-3.873 3.832a46 46 0 0 0 0 10.67c.236 2.022 1.86 3.607 3.873 3.832a47.8 47.8 0 0 0 10.516 0c2.012-.225 3.637-1.81 3.873-3.832a46 46 0 0 0 0-10.67c-.236-2.022-1.86-3.607-3.873-3.832m-10.35 1.49a46.2 46.2 0 0 1 10.184 0c1.33.15 2.395 1.199 2.55 2.517a44.4 44.4 0 0 1 0 10.32a2.89 2.89 0 0 1-2.55 2.516a46.2 46.2 0 0 1-10.184 0a2.89 2.89 0 0 1-2.55-2.516a44.4 44.4 0 0 1 0-10.32a2.89 2.89 0 0 1 2.55-2.516"
      />
    </svg>
  );
}

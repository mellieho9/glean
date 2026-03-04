import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { connectIntegration, checkConnectionStatus, listConnections } from "../utils/api";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";
import SchemaCard from "../components/SchemaCard";

const INTEGRATIONS = [
  {
    slug: "notion",
    name: "Notion",
    manageUrl: "https://www.notion.so/profile/connections",
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
      const { redirect_url } = await connectIntegration(slug, accessToken);
      // Open Notion OAuth in a new tab
      const oauthWindow = window.open(redirect_url, "_blank");

      // Poll existing connections endpoint (fast, already proven to work)
      const poll = setInterval(async () => {
        try {
          const data = await listConnections(accessToken);
          const isConnected = (data.connected || []).some((c) => c.slug === slug);
          if (isConnected) {
            clearInterval(poll);
            if (oauthWindow && !oauthWindow.closed) oauthWindow.close();
            // Save integration to DB (fire-and-forget)
            checkConnectionStatus(slug, accessToken).catch(() => {});
            setConnections((prev) => ({ ...prev, [slug]: true }));
            setConnecting(null);
            setIntegration(slug);
            setTimeout(() => navigate("/select-schemas"), 400);
          }
        } catch {
          // keep polling
        }
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(poll);
        setConnecting(null);
      }, 120000);
    } catch (err) {
      setError(err.message);
      setConnecting(null);
    }
  };

  return (
    <PageLayout
      center
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
              title={
                <span className="flex items-center gap-1">
                  {db.name}
                  {isConnected && db.manageUrl && (
                    <a
                      href={db.manageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Manage access"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <Icon name="open_in_new" className="text-sm" />
                    </a>
                  )}
                </span>
              }
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


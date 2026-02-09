import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  listConnections,
  listConfiguredSchemas,
  listJobs,
  getJob,
} from "../utils/api";
import PageLayout from "../components/PageLayout";
import SchemaCard from "../components/SchemaCard";
import Icon from "../components/Icon";

function SectionHeader({ title, right }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {right}
    </div>
  );
}

function iconForSchema(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("recipe")) return "restaurant_menu";
  if (n.includes("place")) return "location_on";
  if (n.includes("tutorial")) return "lightbulb";
  if (n.includes("comment")) return "forum";
  return "description";
}

function statusLabel(status) {
  if (status === "processing") return "Extracting";
  if (status === "completed") return "Complete";
  if (status === "failed") return "Failed";
  if (status === "pending") return "Queued";
  return status;
}

function statusDot(status) {
  if (status === "processing") return "bg-primary";
  if (status === "completed") return "bg-green-500";
  if (status === "failed") return "bg-red-500";
  return "bg-slate-300";
}

function formatUrl(url) {
  if (!url) return "Untitled video";
  try {
    const u = new URL(url);
    const id = u.searchParams.get("v") || u.pathname.split("/").pop();
    return id ? `youtu.be/${id}` : url;
  } catch {
    return url;
  }
}

function JobCard({ job, schemaName, accessToken }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (job.status === "pending" || job.status === "processing") return;

    if (expanded) {
      setExpanded(false);
      return;
    }

    if (!detail) {
      setLoadingDetail(true);
      try {
        const data = await getJob(job.id, accessToken);
        setDetail(data);
      } catch {
        setDetail({ error: "Failed to load details" });
      } finally {
        setLoadingDetail(false);
      }
    }
    setExpanded(true);
  };

  const copyUrl = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(job.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isClickable = job.status === "completed" || job.status === "failed";

  return (
    <div
      onClick={handleClick}
      className={`w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 transition-colors ${
        isClickable ? "cursor-pointer hover:border-primary/50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot(job.status)}`} />
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-sm font-semibold truncate">{formatUrl(job.url)}</h3>
          <button
            onClick={copyUrl}
            className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            title="Copy URL"
          >
            <Icon
              name={copied ? "check" : "content_copy"}
              filled={false}
              className="w-5"
            />
          </button>
        </div>
        <span className="text-slate-300 shrink-0">·</span>
        <span className="text-[11px] text-slate-400 shrink-0">{schemaName}</span>
        {job.created_at && (
          <>
            <span className="text-slate-300 shrink-0">·</span>
            <span className="text-[11px] text-slate-400 shrink-0">
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </>
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 ml-auto">
          {statusLabel(job.status)}
        </span>
        {isClickable && (
          <Icon
            name={expanded ? "expand_less" : "expand_more"}
            filled={false}
            className="text-slate-400 text-[20px] shrink-0"
          />
        )}
      </div>

      {(job.status === "processing" || job.status === "pending") && (
        <div className="mt-3 space-y-1">
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full w-[40%] animate-pulse" />
          </div>
          <span className="text-[10px] text-slate-400">
            {job.status === "pending"
              ? "Waiting to start..."
              : "Analyzing video content..."}
          </span>
        </div>
      )}

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {loadingDetail ? (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full spinner" />
            </div>
          ) : detail?.error && job.status === "failed" ? (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-medium text-red-600 mb-1">Error</p>
              <p className="text-xs text-red-500">{detail.error}</p>
            </div>
          ) : detail?.result?.extracted_data ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500">Extracted Data</p>
              {detail.result.extracted_data.map((item, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 p-3">
                  {Object.entries(item).map(([key, val]) => (
                    <div key={key} className="flex gap-2 py-0.5">
                      <span className="text-[11px] font-medium text-slate-500 shrink-0">
                        {key}:
                      </span>
                      <span className="text-[11px] text-slate-700 break-words">
                        {typeof val === "object" ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No data available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { accessToken, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [connections, setConnections] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!accessToken) {
      navigate("/", { replace: true });
      return;
    }

    async function load() {
      try {
        const [connsData, schemaList, jobList] = await Promise.all([
          listConnections(accessToken).catch(() => ({})),
          listConfiguredSchemas(accessToken).catch(() => []),
          listJobs(accessToken).catch(() => []),
        ]);
        const conns = connsData?.connected || [];
        setConnections(Array.isArray(conns) ? conns : []);
        setSchemas(Array.isArray(schemaList) ? schemaList : []);
        setJobs(Array.isArray(jobList) ? jobList : []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full spinner" />
        </div>
      </PageLayout>
    );
  }

  // Build a source_id → schema name map
  const schemaNameMap = {};
  for (const s of schemas) {
    schemaNameMap[s.source_id] = s.name;
  }

  const activeJobs = jobs.filter(
    (j) => j.status === "processing" || j.status === "pending"
  );
  const recentJobs = jobs.slice(0, 10);

  return (
    <PageLayout>
      <div className="max-w mx-auto px-6 pb-24">
        {/* Connected Databases */}
        <section className="mb-12">
          <SectionHeader title="Connected Databases" />
          {connections.length === 0 ? (
            <SchemaCard
              icon="add_circle"
              title="Connect a database"
              subtitle="Link your data sources to get started"
              onClick={() => navigate("/connect")}
            />
          ) : (
            <div className="space-y-3">
              {connections.map((conn) => (
                <SchemaCard
                  key={conn.slug || conn.name}
                  icon="database"
                  title={conn.name || conn.slug}
                  subtitle="Connected"
                  action={
                    <button
                      onClick={() => navigate("/connect")}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Active Schemas */}
        <section className="mb-12">
          <SectionHeader
            title="Active Schemas"
            right={
              <button
                onClick={() => navigate("/select-schemas")}
                className="text-sm font-medium flex items-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Icon name="add" className="text-[18px] mr-1" />
                New Schema
              </button>
            }
          />
          {schemas.length === 0 ? (
            <div className="bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
              <p className="text-sm text-slate-500">No schemas configured yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schemas.map((schema) => (
                <SchemaCard
                  key={schema.source_id}
                  icon={iconForSchema(schema.name)}
                  title={schema.name}
                  action={
                    <button
                      onClick={() => navigate("/configure")}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Reconfigure
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* Processing Queue */}
        <section>
          <SectionHeader
            title="Processing Queue"
            right={
              <div className="flex items-center text-xs font-medium text-slate-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    activeJobs.length > 0 ? "bg-primary" : "bg-slate-300"
                  }`}
                />
                {activeJobs.length > 0
                  ? `${activeJobs.length} active`
                  : "Ready for input"}
              </div>
            }
          />
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <div className="bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-xl text-center">
                <p className="text-sm text-slate-500">
                  No extractions yet. Use the Chrome extension to process videos.
                </p>
              </div>
            ) : (
              recentJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  schemaName={schemaNameMap[job.source_id] || job.source_id}
                  accessToken={accessToken}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

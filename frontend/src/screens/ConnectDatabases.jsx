import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";
import SchemaCard from "../components/SchemaCard";
import { mockDatabases } from "../utils/mockData";

export default function ConnectDatabases() {
  const navigate = useNavigate();
  const [databases, setDatabases] = useState(mockDatabases);

  const handleConnect = (id) => {
    setDatabases((prev) =>
      prev.map((db) => (db.id === id ? { ...db, connected: true } : db))
    );
    setTimeout(() => navigate("/select-schemas"), 600);
  };

  return (
    <PageLayout
      center
      step={0}
      title="Connect your databases"
      description="Link your data sources to get started."
    >
      <div className="grid gap-4">
        {databases.map((db) => (
          <SchemaCard
            key={db.id}
            as="button"
            iconElement={<NotionIcon />}
            title={db.name}
            subtitle={db.description}
            onClick={() => handleConnect(db.id)}
            disabled={db.connected}
            action={
              db.connected && (
                <Icon name="check_circle" className="text-primary text-2xl" />
              )
            }
          />
        ))}

        <div className="bg-slate-50/50 border border-dashed border-slate-200 p-4 rounded-xl opacity-60">
          <div className="text-left">
            <h3 className="font-semibold text-sm">More coming soon</h3>
            <p className="text-xs text-slate-500">
              Obsidian, Google Sheets, and Airtable integrations are on the way.
            </p>
          </div>
        </div>
      </div>
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

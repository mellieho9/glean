import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProgressSteps from "../components/ProgressSteps";
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
    <div className="bg-white text-slate-900 min-h-screen">
      <Header showAvatar />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <ProgressSteps currentStep={1} />

        <div className="max-w-2xl mx-auto text-center mt-16">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Connect your databases
          </h1>
          <p className="text-slate-500 mb-12 text-lg">
            Glean extracts structured data from your favorite videos directly
            into your personal knowledge base.
          </p>

          <div className="grid gap-6">
            {databases.map((db) => (
              <div
                key={db.id}
                className="group bg-white border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 rounded-2xl"
              >
                <div className="flex items-center mb-6 md:mb-0">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mr-6">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.459 4.21c.195-.453.593-.787 1.066-.893l12.188-2.731c.904-.202 1.737.48 1.737 1.405v15.632c0 .35-.14.686-.389.936l-2.459 2.459a1.324 1.324 0 0 1-1.874 0L3.102 9.387a1.324 1.324 0 0 1-.31-1.29l1.667-3.887zM5.385 7.925l8.769 8.769V5.151L5.385 7.12v.805z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold">{db.name}</h3>
                    <p className="text-sm text-slate-500">{db.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleConnect(db.id)}
                  disabled={db.connected}
                  className={`w-full md:w-auto px-8 py-3 font-medium rounded-xl transition-all cursor-pointer ${
                    db.connected
                      ? "bg-emerald-500 text-white"
                      : "bg-primary text-white hover:bg-opacity-90 active:scale-95 shadow-lg shadow-primary/20"
                  }`}
                >
                  {db.connected ? "Connected" : "Connect"}
                </button>
              </div>
            ))}

            <div className="bg-slate-50/50 border border-dashed border-slate-200 p-6 flex items-center justify-between opacity-60 rounded-2xl">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-6">
                  <span className="material-symbols-outlined outlined text-3xl">
                    add
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold">More coming soon</h3>
                  <p className="text-sm text-slate-500">
                    Obsidian, Tana, and Airtable integrations are on the way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { mockSchemas } from "../utils/mockData";

export default function SelectSchemas() {
  const navigate = useNavigate();
  const [schemas, setSchemas] = useState(mockSchemas);

  const toggleSchema = (id) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectedCount = schemas.filter((s) => s.selected).length;
  const totalSteps = 3;
  const currentStep = 1;
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
              <span>STEP {currentStep} OF {totalSteps}</span>
              <span>{percent}% COMPLETE</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl shadow-slate-100">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Select Schemas</h1>
              <p className="text-slate-500">
                Choose the databases you want to access from your workspace.
              </p>
            </div>

            <div className="space-y-4">
              {schemas.map((schema) => (
                <label
                  key={schema.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-primary/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm border border-slate-100">
                      <span className="material-symbols-outlined outlined text-slate-600">
                        {schema.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{schema.name}</h3>
                      <p className="text-xs text-slate-500">{schema.type}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={schema.selected}
                    onChange={() => toggleSchema(schema.id)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary bg-white accent-primary"
                  />
                </label>
              ))}
            </div>

            <div className="mt-10 pt-6 flex flex-col gap-3">
              <button
                onClick={() => navigate("/configure")}
                disabled={selectedCount === 0}
                className="w-full py-4 px-4 bg-primary text-white font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
              <button
                onClick={() => navigate("/connect")}
                className="w-full py-2 px-4 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors cursor-pointer"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="h-20" />
    </div>
  );
}

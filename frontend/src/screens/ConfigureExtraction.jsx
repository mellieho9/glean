import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ProgressBar from "../components/ProgressBar";
import { mockQuestions } from "../utils/mockData";

export default function ConfigureExtraction() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(mockQuestions);

  const selectOption = (questionId, optionValue) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                selected: o.value === optionValue,
              })),
            }
          : q
      )
    );
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-8 pt-8 pb-32">
        <ProgressBar step={2} totalSteps={3} label="Customizing Schema" />

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Configure Data Extraction
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl">
            Our agent has generated some questions to help define the extraction
            rules for your selected schema.
          </p>
        </div>

        <div className="space-y-8">
          {/* Target Schema Badge */}
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                <span className="material-symbols-outlined outlined text-primary">
                  restaurant_menu
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Schema
                </p>
                <p className="text-base font-semibold text-slate-900">
                  Recipes
                </p>
              </div>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-all text-slate-400 hover:text-primary cursor-pointer">
              <span className="material-symbols-outlined outlined">
                expand_more
              </span>
            </button>
          </div>

          {/* Questions Card */}
          <div className="bg-white border border-slate-200 p-10 rounded-[2rem] shadow-sm">
            <div className="flex items-start gap-5 mb-10">
              <div className="w-12 h-12 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">
                  psychology
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Extraction Rules
                </h2>
                <p className="text-slate-500 mt-1">
                  Refining the &ldquo;Ingredients&rdquo; property
                </p>
              </div>
            </div>

            {questions.map((q, qi) => (
              <div
                key={q.id}
                className={
                  qi > 0
                    ? "mt-12 pt-10 border-t border-slate-100"
                    : undefined
                }
              >
                <p className="text-slate-900 font-semibold mb-6">
                  {q.question}
                </p>

                {q.type === "select" && (
                  <div className="space-y-4">
                    {q.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`relative flex items-center p-5 border rounded-2xl cursor-pointer transition-all group ${
                          opt.selected
                            ? "border-primary bg-indigo-50/30"
                            : "border-slate-200 hover:border-primary hover:bg-indigo-50/30"
                        }`}
                        onClick={() => selectOption(q.id, opt.value)}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          checked={opt.selected}
                          readOnly
                          className="w-5 h-5 text-primary border-slate-300 focus:ring-primary accent-primary"
                        />
                        <div className="ml-4">
                          <span className="block text-sm font-bold text-slate-900">
                            {opt.label}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            {opt.description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === "card-select" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => selectOption(q.id, opt.value)}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl transition-all cursor-pointer ${
                          opt.selected
                            ? "border-2 border-primary bg-indigo-50/50"
                            : "border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined mb-3 text-2xl ${
                            opt.selected ? "text-primary" : "text-slate-400"
                          }`}
                        >
                          {opt.icon}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            opt.selected
                              ? "text-slate-900"
                              : "text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between pt-8">
          <button
            onClick={() => navigate("/select-schemas")}
            className="group flex items-center gap-2 px-4 py-2 font-semibold text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined outlined text-xl transition-transform group-hover:-translate-x-1">
              arrow_back
            </span>
            Back
          </button>
          <button
            onClick={() => navigate("/generating")}
            className="bg-primary hover:bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-[0.98] cursor-pointer"
          >
            Continue to Final Step
          </button>
        </div>
      </main>
    </div>
  );
}

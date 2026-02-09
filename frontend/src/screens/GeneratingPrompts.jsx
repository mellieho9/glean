import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import { configureSchema } from "../utils/api";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";

export default function GeneratingPrompts() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { integration, selectedSources, answers, setConfigResult } =
    useOnboarding();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing database structure");
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const started = useRef(false);

  // Run configuration for each selected source
  useEffect(() => {
    if (started.current || !accessToken || selectedSources.length === 0) return;
    started.current = true;

    const run = async () => {
      const total = selectedSources.length;
      const results = [];

      for (let i = 0; i < total; i++) {
        const source = selectedSources[i];
        const sourceId = source.id || source.source_id;
        const tag = source.title || source.name || sourceId;

        setStatusText(`Configuring ${tag}…`);
        setSteps((prev) => [
          ...prev,
          { label: `Configuring ${tag}`, done: false },
        ]);

        // Gather answers for this source
        const sourceAnswers = {};
        for (const [key, value] of Object.entries(answers)) {
          if (key.startsWith(`${sourceId}:`)) {
            const questionId = key.split(":")[1];
            sourceAnswers[questionId] = value;
          }
        }

        try {
          const result = await configureSchema(
            integration,
            sourceId,
            sourceAnswers,
            accessToken
          );
          results.push(result);

          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, done: true } : s))
          );
          setProgress(Math.round(((i + 1) / total) * 90));
        } catch (err) {
          setError(err.message);
          return;
        }
      }

      setConfigResult(results);
      setStatusText("Finalizing…");
      setProgress(100);
    };

    run();
  }, [accessToken, integration, selectedSources, answers, setConfigResult]);

  // Update status text based on progress
  useEffect(() => {
    if (progress >= 30 && progress < 60 && !error) {
      setStatusText("Generating extraction rules");
    } else if (progress >= 60 && progress < 90 && !error) {
      setStatusText("Finalizing prompt logic");
    }
  }, [progress, error]);

  // Navigate when done
  useEffect(() => {
    if (progress >= 100 && !error) {
      const timeout = setTimeout(() => navigate("/complete"), 600);
      return () => clearTimeout(timeout);
    }
  }, [progress, error, navigate]);

  const sourceNames = selectedSources.map(
    (s) => s.title || s.name || "database"
  );

  return (
    <PageLayout
      center
      step={3}
      title="Generating AI Prompts"
      description={
        sourceNames.length === 1 ? (
          <>
            Crafting a custom extraction schema for your{" "}
            <span className="text-slate-900 font-medium italic">
              {sourceNames[0]}
            </span>{" "}
            database…
          </>
        ) : (
          <>
            Crafting custom extraction schemas for{" "}
            <span className="text-slate-900 font-medium italic">
              {sourceNames.slice(0, -1).join(", ")}
            </span>
            {" and "}
            <span className="text-slate-900 font-medium italic">
              {sourceNames[sourceNames.length - 1]}
            </span>
            …
          </>
        )
      }
    >
      {/* Progress Bar */}
      <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div className="absolute inset-0 shimmer-bg" />
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full loading-bar-glow transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          <span>{error ? "Error" : statusText}</span>
        </div>

        {/* Step checklist */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                  step.done
                    ? "bg-white border-slate-100 shadow-sm"
                    : "bg-slate-50/50 border-dashed border-slate-200"
                }`}
              >
                {step.done ? (
                  <Icon
                    name="check_circle"
                    className="text-emerald-500 text-lg"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent spinner" />
                )}
                <span className="text-xs text-slate-600">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 text-center">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={() => navigate("/configure")}
              className="px-6 py-2 bg-primary text-white text-sm rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

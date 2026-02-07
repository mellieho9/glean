import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { mockLoadingSteps } from "../utils/mockData";

export default function GeneratingPrompts() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState(mockLoadingSteps);
  const [statusText, setStatusText] = useState("Analyzing database structure");

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    if (progress >= 30 && progress < 60) {
      setStatusText("Generating extraction rules");
    } else if (progress >= 60 && progress < 90) {
      setStatusText("Finalizing prompt logic");
      setSteps((prev) =>
        prev.map((s, i) =>
          i === 2 ? { ...s, done: false, active: true } : { ...s, done: true, active: false }
        )
      );
    } else if (progress >= 90) {
      setStatusText("Almost done...");
      setSteps((prev) => prev.map((s) => ({ ...s, done: true, active: false })));
    }
  }, [progress]);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => navigate("/complete"), 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, navigate]);

  // Progress bar dots
  const totalDots = 5;
  const filledDots = Math.min(
    totalDots,
    Math.ceil((progress / 100) * totalDots)
  );

  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-6">
        {/* Step indicator dots */}
        <div className="mb-12 flex items-center space-x-4 opacity-40">
          {Array.from({ length: totalDots }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full ${
                i === filledDots - 1 ? "w-12" : "w-8"
              } ${i < filledDots ? "bg-primary" : "bg-slate-200"}`}
            />
          ))}
        </div>

        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-[Outfit] font-medium tracking-tight text-slate-900">
              Generating AI Prompts
            </h1>
            <p className="text-slate-500 text-sm">
              Crafting a custom extraction schema for your{" "}
              <span className="text-slate-900 font-medium italic">
                recipes
              </span>{" "}
              database...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="absolute inset-0 shimmer-bg" />
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full loading-bar-glow transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-widest text-slate-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{statusText}</span>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                    step.active
                      ? "bg-slate-50/50 border border-dashed border-slate-200"
                      : "bg-white border border-slate-100 shadow-sm"
                  }`}
                >
                  {step.done ? (
                    <span className="material-symbols-outlined text-emerald-500 text-lg">
                      check_circle
                    </span>
                  ) : step.active ? (
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent spinner" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200" />
                  )}
                  <span
                    className={`text-xs ${
                      step.active ? "text-slate-600 font-medium" : "text-slate-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="py-8" />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function GeneratingPrompts() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing database structure");

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(id);
          return 100;
        }
        return prev + 1;
      });
    }, 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 30 && progress < 60) {
      setStatusText("Generating extraction rules");
    } else if (progress >= 60 && progress < 90) {
      setStatusText("Finalizing prompt logic");
    } else if (progress >= 90) {
      setStatusText("Almost done...");
    }
  }, [progress]);

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => navigate("/complete"), 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, navigate]);

  return (
    <PageLayout
      center
      step={3}
      title="Generating AI Prompts"
      description={
        <>
          Crafting a custom extraction schema for your{" "}
          <span className="text-slate-900 font-medium italic">recipes</span>{" "}
          database...
        </>
      }
    >
      {/* Progress Bar */}
      <div className="relative w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-8">
        <div className="absolute inset-0 shimmer-bg" />
        <div
          className="absolute top-0 left-0 h-full bg-primary rounded-full loading-bar-glow transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Status */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-widest text-slate-400">
          <span>{statusText}</span>
        </div>
      </div>
    </PageLayout>
  );
}

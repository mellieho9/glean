import { useNavigate } from "react-router-dom";
import { useOnboarding } from "../context/OnboardingContext";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";

const STEPS = [
  {
    icon: "extension",
    title: "Open Chrome Extensions",
    description: "Go to chrome://extensions in your browser and enable Developer mode in the top-right corner.",
  },
  {
    icon: "upload",
    title: "Load the extension",
    description: 'Click "Load unpacked" and select the chrome-extension folder from this project.',
  },
  {
    icon: "play_circle",
    title: "Extract from YouTube",
    description: "Navigate to any YouTube video, click the Glean extension icon, and hit Extract.",
  },
];

export default function SetupComplete() {
  const navigate = useNavigate();
  const { selectedSources, configResult } = useOnboarding();

  const configuredCount = configResult?.length || selectedSources.length;

  return (
    <PageLayout
      center
      step={3}
      title="Setup Complete"
      description={`${configuredCount} schema${configuredCount !== 1 ? "s" : ""} configured. Follow the steps below to start extracting.`}
    >
      <div className="mb-6 flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <Icon name="check_circle" className="text-green-600 text-4xl" />
        </div>
      </div>

      <div className="w-full space-y-4 mb-8">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-4 items-start p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="w-full py-3 bg-primary text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        Go to Dashboard
      </button>
    </PageLayout>
  );
}

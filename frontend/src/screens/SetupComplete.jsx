import { useOnboarding } from "../context/OnboardingContext";
import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";

export default function SetupComplete() {
  const { selectedSources, configResult } = useOnboarding();

  const configuredCount = configResult?.length || selectedSources.length;

  return (
    <PageLayout
      center
      step={3}
      title="Setup Complete"
      description={`${configuredCount} schema${configuredCount !== 1 ? "s" : ""} configured. Start extracting data directly from your browser.`}
    >
      <div className="mb-8 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <Icon name="check_circle" className="text-green-600 text-5xl" />
        </div>
      </div>

      <button
        className="w-full py-3 bg-primary text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Icon name="extension" className="text-[20px]" />
        <span>Install Chrome Extension</span>
      </button>
    </PageLayout>
  );
}

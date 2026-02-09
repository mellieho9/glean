import PageLayout from "../components/PageLayout";
import Icon from "../components/Icon";

export default function SetupComplete() {
  return (
    <PageLayout
      center
      step={3}
      title="Setup Complete"
      description="Your configuration is ready. Start extracting schemas directly from your browser."
    >
      <div className="mb-8 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <Icon name="check_circle" className="text-green-600 text-5xl" />
        </div>
      </div>

      <a
        href="https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 bg-primary text-white font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        <Icon name="extension" aria-hidden="true" className="text-[20px]" />
        <span>Install Chrome Extension</span>
      </a>
    </PageLayout>
  );
}

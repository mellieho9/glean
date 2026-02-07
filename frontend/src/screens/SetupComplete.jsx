import Header from "../components/Header";

export default function SetupComplete() {
  return (
    <div className="bg-white text-slate-900 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center max-w-md w-full text-center">
          <div className="mb-8 w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-green-600 text-6xl">
              check_circle
            </span>
          </div>

          <h1 className="text-4xl font-[Outfit] font-bold tracking-tight text-slate-900 mb-4">
            Setup Complete
          </h1>
          <p className="text-slate-500 mb-10 text-lg">
            Your configuration is ready. Start extracting schemas directly from
            your browser.
          </p>

          <button className="px-6 py-2.5 bg-primary text-white font-medium rounded-full transition-shadow duration-200 hover:shadow-md active:shadow-sm flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">
              extension
            </span>
            <span>Install Chrome Extension</span>
          </button>
        </div>
      </main>
    </div>
  );
}

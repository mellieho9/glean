import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <button
        type="button"
        className="flex items-center space-x-2 cursor-pointer bg-transparent border-none p-0"
        onClick={() => navigate("/")}
        aria-label="Go to home"
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">
            auto_awesome
          </span>
        </div>
        <span className="text-xl font-semibold tracking-tight">
          glean
        </span>
      </button>
    </header>
  );
}

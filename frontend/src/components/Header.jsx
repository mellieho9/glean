import { useNavigate } from "react-router-dom";

export default function Header({ showAvatar = false }) {
  const navigate = useNavigate();

  return (
    <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-xl">
            auto_awesome
          </span>
        </div>
        <span className="font-[Outfit] text-xl font-semibold tracking-tight">
          glean
        </span>
      </div>
      <div className="flex items-center space-x-4">
        {showAvatar && (
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
            M
          </div>
        )}
      </div>
    </header>
  );
}

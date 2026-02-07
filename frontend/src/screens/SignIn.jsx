import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const navigate = useNavigate();

  return (
    <div className="bg-white text-slate-900 overflow-hidden min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">
                auto_awesome
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">
            glean
          </h1>
          <p className="text-slate-400 text-xs font-medium tracking-[0.15em] uppercase">
            Video to Schema
          </p>
        </div>

        <div className="w-full bg-white border border-slate-100 p-10 rounded-[2rem] shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-slate-900">Sign In</h2>
            <p className="text-slate-500 text-sm mt-2">
              Continue to your dashboard
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/connect")}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-6 py-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-slate-700">Continue with Google</span>
            </button>

            <div className="pt-2">
              <p className="text-[11px] text-center text-slate-400 leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

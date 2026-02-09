import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { exchangeCodeForSession } from "../utils/api";
import Icon from "../components/Icon";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const code = searchParams.get("code");
  const [error, setError] = useState(() => (code ? null : "No authorization code found"));
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code || exchanged.current) return;
    exchanged.current = true;

    exchangeCodeForSession(code)
      .then((session) => {
        login(session);
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => setError(err.message));
  }, [code, login, navigate]);

  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Icon name="error" className="text-red-500 text-3xl" />
          </div>
          <h1 className="text-xl font-bold mb-2">Sign-in failed</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-primary rounded-full spinner mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUser, refreshToken as refreshTokenApi } from "../utils/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "glean_access_token";
const REFRESH_KEY = "glean_refresh_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const saveTokens = useCallback((access, refresh) => {
    setAccessToken(access);
    if (access) localStorage.setItem(TOKEN_KEY, access);
    else localStorage.removeItem(TOKEN_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    else localStorage.removeItem(REFRESH_KEY);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveTokens(null, null);
  }, [saveTokens]);

  // On mount, restore session from stored token
  useEffect(() => {
    if (!accessToken) return void setLoading(false);

    let cancelled = false;
    (async () => {
      try {
        const u = await getUser(accessToken);
        if (!cancelled) setUser(u);
      } catch {
        const refresh = localStorage.getItem(REFRESH_KEY);
        if (refresh) {
          try {
            const result = await refreshTokenApi(refresh);
            if (!cancelled) {
              saveTokens(result.access_token, result.refresh_token);
              const u = await getUser(result.access_token);
              if (!cancelled) setUser(u);
            }
            return;
          } catch { /* fall through */ }
        }
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(
    (sessionData) => {
      saveTokens(sessionData.access_token, sessionData.refresh_token);
      setUser(sessionData.user);
    },
    [saveTokens]
  );

  return (
    <AuthContext.Provider
      value={{ user, accessToken, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

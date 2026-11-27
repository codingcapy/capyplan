let accessToken: string | null = null;

const API_BASE = import.meta.env.DEV
  ? "http://localhost:3333"
  : window.location.origin;

export function setSession(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type RefreshResult = { user: any; token: string } | null;
let refreshPromise: Promise<RefreshResult> | null = null;

// De-duplicated: concurrent callers share one network request.
export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = (async (): Promise<RefreshResult> => {
      try {
        const res = await fetch(`${API_BASE}/api/v0/user/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        const token = data.result?.token;
        const user = data.result?.user;
        if (!token || !user) return null;
        setSession(token);
        return { user, token };
      } catch (err) {
        console.log(err);
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

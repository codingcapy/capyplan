import { hc, type ClientResponse } from "hono/client";
import { type ApiRoutes } from "@server/app";
import { getAccessToken, refreshSession } from "../../services/jwt.service";
import useAuthStore from "../../store/AuthStore";

export type ArgumentTypes<F extends Function> = F extends (
  ...args: infer A
) => any
  ? A
  : never;

export type ExtractData<T> =
  T extends ClientResponse<infer Data, any, any> ? Data : never;

const devServer = "http://localhost:3333";
const prodServer = window.location.origin;

async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const req = new Request(input, init);
  const retry = req.clone();
  const token = getAccessToken();
  if (token) req.headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(req);
  if (res.status !== 401) return res;
  const refreshed = await refreshSession();
  if (!refreshed) {
    useAuthStore.getState().clearAuth();
    return res;
  }
  retry.headers.set("Authorization", `Bearer ${refreshed.token}`);
  return fetch(retry);
}

export const client = hc<ApiRoutes>(
  import.meta.env.DEV ? devServer : prodServer,
  { fetch: authFetch as typeof fetch },
);

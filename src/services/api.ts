// JSON API convenience layer.
// Builds query strings, delegates transport, auth and error handling to
// `./http`, and unwraps the `{ data }` response envelope. Every helper rejects
// with ApiError (from `./http`) rather than a bare fetch error.

import { envelopeData, request } from "./http";

/**
 * Serialises a params object into a query string.
 * Arrays become repeated keys, while undefined, null and empty strings are
 * skipped so optional filters do not produce `?status=`. Always callers
 * receive either `?a=b` or an empty string.
 */
export const buildQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, String(entry)));
      return;
    }

    search.append(key, String(value));
  });

  const query = search.toString();

  return query ? `?${query}` : "";
};

type QueryOptions = {
  params?: Record<string, unknown>;
  auth?: boolean;
};

type BodyOptions = {
  body?: unknown;
  auth?: boolean;
};

/**
 * Sends an authenticated GET request by default.
 * Builds the URL from `path` plus `buildQuery(params)`, then returns the
 * unwrapped envelope data (an empty object when the body has no data).
 * Pass `{ auth: false }` for public endpoints. Throws ApiError on failure.
 */
export const apiGet = async (path: string, { params, auth = true }: QueryOptions = {}) => {
  const payload = await request(`${path}${buildQuery(params)}`, { auth });

  return envelopeData(payload) ?? {};
};

/**
 * Sends an authenticated POST request.
 * Body is JSON-encoded by `request`. Returns the unwrapped envelope data, or an
 * empty object when absent. Throws ApiError on failure.
 */
export const apiPost = async (path: string, body?: unknown, { auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "POST", body, auth });

  return envelopeData(payload) ?? {};
};

/**
 * Sends an authenticated PATCH request.
 * Returns the unwrapped envelope data, or an empty object when absent.
 * Throws ApiError on failure.
 */
export const apiPatch = async (path: string, body?: unknown, { auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "PATCH", body, auth });

  return envelopeData(payload) ?? {};
};

/**
 * Sends an authenticated PUT request.
 * Returns the unwrapped envelope data, or an empty object when absent.
 * Throws ApiError on failure.
 */
export const apiPut = async (path: string, body?: unknown, { auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "PUT", body, auth });

  return envelopeData(payload) ?? {};
};

/**
 * Sends an authenticated DELETE request, optionally with a body.
 * Returns the unwrapped envelope data, or an empty object when absent.
 * Throws ApiError on failure.
 */
export const apiDelete = async (path: string, { body, auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "DELETE", body, auth });

  return envelopeData(payload) ?? {};
};

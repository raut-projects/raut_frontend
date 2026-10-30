import { envelopeData, request } from "./http";

// The backend takes its filters as query parameters, and it expects `page` and
// `page_size` rather than an offset/limit pair.
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

export const apiGet = async (path: string, { params, auth = true }: QueryOptions = {}) => {
  const payload = await request(`${path}${buildQuery(params)}`, { auth });

  return envelopeData(payload) ?? {};
};

export const apiPost = async (path: string, body?: unknown, { auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "POST", body, auth });

  return envelopeData(payload) ?? {};
};

export const apiPut = async (path: string, body?: unknown, { auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "PUT", body, auth });

  return envelopeData(payload) ?? {};
};

export const apiDelete = async (path: string, { body, auth = true }: BodyOptions = {}) => {
  const payload = await request(path, { method: "DELETE", body, auth });

  return envelopeData(payload) ?? {};
};

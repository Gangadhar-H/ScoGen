import api from "./client.js";

const cache = {};
const TTL_MS = 5 * 60 * 1000; // 5 min — these barely change

function cached(key, fetcher) {
  return async () => {
    const entry = cache[key];
    if (entry && Date.now() - entry.time < TTL_MS) return entry.data;
    const data = await fetcher();
    cache[key] = { data, time: Date.now() };
    return data;
  };
}

export const lookupsApi = {
  departments: cached("departments", () => api.get("/lookups/departments")),
  exceptionTypes: cached("exceptionTypes", () =>
    api.get("/lookups/exception-types")
  ),
  policies: cached("policies", () => api.get("/lookups/policies")),
  complianceFrameworks: cached("complianceFrameworks", () =>
    api.get("/lookups/compliance-frameworks")
  ),
  invalidate: (key) =>
    key
      ? delete cache[key]
      : Object.keys(cache).forEach((k) => delete cache[k]),
};

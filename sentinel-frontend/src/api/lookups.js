import api from "./client.js";

export const lookupsApi = {
  departments: () => api.get("/lookups/departments"),
  exceptionTypes: () => api.get("/lookups/exception-types"),
  policies: () => api.get("/lookups/policies"),
  complianceFrameworks: () => api.get("/lookups/compliance-frameworks"),
};

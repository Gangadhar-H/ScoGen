import api from "./client.js";

export const reportsApi = {
  dashboard: () => api.get("/reports/dashboard"),
  active: (params) => api.get("/reports/active-exceptions", params),
  expired: (params) => api.get("/reports/expired-exceptions", params),
  critical: (params) => api.get("/reports/critical-exceptions", params),
  departmentWise: () => api.get("/reports/department-wise"),
  exportPdfUrl: (type) => `/api/reports/export/pdf?type=${type}`,
  policyEffectiveness: () => api.get("/reports/policy-effectiveness"),
  complianceImpact: (framework) =>
    api.get("/reports/compliance-impact", framework ? { framework } : {}),
  governanceScore: () => api.get("/reports/governance-score"), // NEW
};

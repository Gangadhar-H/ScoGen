import api from "./client.js";

export const advisorApi = {
  suggest: (data) => api.post("/advisor/suggest", data),
};

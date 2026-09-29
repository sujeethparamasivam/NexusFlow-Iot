import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();

export const api = axios.create({
  baseURL: apiBaseUrl
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

setAuthToken(localStorage.getItem("nexusflow_token"));

export const wsUrl = () => {
  const token = encodeURIComponent(localStorage.getItem("nexusflow_token") || "");
  return apiBaseUrl.replace(/^http/, "ws").replace(/\/api$/, "") + `/ws?token=${token}`;
};

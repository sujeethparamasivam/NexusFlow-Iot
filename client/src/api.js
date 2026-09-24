import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});
  
export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
  
setAuthToken(localStorage.getItem("nexusflow_token"));

export const wsUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const token = encodeURIComponent(localStorage.getItem("nexusflow_token") || "");
  return apiUrl.replace(/^http/, "ws").replace(/\/api$/, "") + `/ws?token=${token}`;
};

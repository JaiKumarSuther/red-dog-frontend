import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("rdg_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const reqUrl = String(error.config?.url ?? "");
      // Auth endpoints handle their own errors in the component — do not clear
      // session or hard-navigate, as that would hide the inline error.
      const isAuthEndpoint =
        reqUrl.includes("auth/login") ||
        reqUrl.includes("auth/register") ||
        reqUrl.includes("auth/forgot-password") ||
        reqUrl.includes("auth/verify-email") ||
        reqUrl.includes("auth/verify-otp") ||
        reqUrl.includes("auth/resend-verification") ||
        reqUrl.includes("auth/reset-password");
      if (!isAuthEndpoint) {
        localStorage.removeItem("rdg_token");
        localStorage.removeItem("rdg_user");
        document.cookie = "rdg_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "rdg_onboarding=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

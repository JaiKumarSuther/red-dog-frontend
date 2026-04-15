import axios from "axios";

/** Paths are relative to /api (no leading slash) so axios joins correctly with baseURL. */
const adminApi = axios.create({
  baseURL: "/api/",
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("rdg_admin_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("rdg_admin_token");
        localStorage.removeItem("rdg_admin_user");
        document.cookie = "rdg_admin_token=; path=/; max-age=0";
        if (!window.location.pathname.startsWith("/admin/login")) {
          window.location.href = "/admin/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default adminApi;

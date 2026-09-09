import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Request Interceptor: Attach JWT ─────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("rr_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401 & Unwrap Pagination ─────────
apiClient.interceptors.response.use(
  (response) => {
    const resData = response.data;
    if (resData && resData.success !== undefined && resData.data) {
      if (resData.data.pagination) {
        const arrayKey = Object.keys(resData.data).find(
          (k) => k !== "pagination" && k !== "stats"
        );
        if (arrayKey && Array.isArray(resData.data[arrayKey])) {
          response.data = {
            success: resData.success,
            data: resData.data[arrayKey],
            pagination: resData.data.pagination,
            stats: resData.data.stats,
            message: resData.message,
          };
        }
      }
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("rr_token");
      localStorage.removeItem("rr_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;

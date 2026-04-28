import axios from "axios";
import { Asset, Violation, DashboardStats, ScanResult } from "./types";
import { auth } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      auth.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, { username, password });
    return res.data as { access_token: string; username: string };
  },
  changePassword: async (current_password: string, new_password: string) => {
    const res = await api.post("/api/auth/change-password", { current_password, new_password });
    return res.data;
  },
};

export const dmcaApi = {
  generate: async (violationId: string): Promise<string> => {
    const res = await api.post(`/api/violations/${violationId}/dmca`, null, {
      responseType: "text",
    });
    return res.data;
  },
};

export const assetsApi = {
  upload: async (formData: FormData): Promise<Asset> => {
    const res = await api.post("/api/assets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  list: async (): Promise<Asset[]> => {
    const res = await api.get("/api/assets/");
    return res.data;
  },

  get: async (id: string): Promise<Asset> => {
    const res = await api.get(`/api/assets/${id}`);
    return res.data;
  },

  scan: async (id: string): Promise<ScanResult> => {
    const res = await api.post(`/api/assets/${id}/scan`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/assets/${id}`);
  },

  getFingerprint: async (id: string) => {
    const res = await api.get(`/api/assets/${id}/fingerprint`);
    return res.data;
  },
};

export const violationsApi = {
  list: async (status?: string, asset_id?: string): Promise<Violation[]> => {
    const res = await api.get("/api/violations/", { params: { status, asset_id } });
    return res.data;
  },

  get: async (id: string): Promise<Violation> => {
    const res = await api.get(`/api/violations/${id}`);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    await api.patch(`/api/violations/${id}/status`, null, { params: { status } });
  },

  stats: async () => {
    const res = await api.get("/api/violations/stats/summary");
    return res.data;
  },
};

export const demoApi = {
  seed: async () => {
    const res = await api.post("/api/demo/seed");
    return res.data as { assets_created: number; violations_created: number };
  },
  clear: async () => {
    const res = await api.delete("/api/demo/clear");
    return res.data;
  },
};

export const monitoringApi = {
  dashboard: async (): Promise<DashboardStats> => {
    const res = await api.get("/api/monitoring/dashboard");
    return res.data;
  },

  activity: async () => {
    const res = await api.get("/api/monitoring/activity");
    return res.data;
  },
};

import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// API endpoints
export const dashboardAPI = {
  // Dashboard metrics
  getDashboardMetrics: (startDate?: string, endDate?: string) =>
    api.get("/dashboard/metrics", { params: { start_date: startDate, end_date: endDate } }),

  // Funnel analysis
  getFunnelAnalysis: (deviceType?: string, startDate?: string, endDate?: string) =>
    api.get("/funnel/analysis", {
      params: { device_type: deviceType, start_date: startDate, end_date: endDate },
    }),

  getDropoffAnalysis: (deviceType?: string, limit?: number) =>
    api.get("/funnel/dropoff", { params: { device_type: deviceType, limit } }),

  // User behavior
  getUserBehavior: (userId: string) => api.get(`/users/${userId}/behavior`),

  getSimilarUsers: (userId: string, limit?: number, deviceFilter?: string) =>
    api.get(`/users/similar/${userId}`, {
      params: { limit, device_filter: deviceFilter },
    }),

  // Sentiment analysis
  getSentimentAnalysis: (page?: string, startDate?: string, endDate?: string) =>
    api.get("/sentiment/analysis", {
      params: { page, start_date: startDate, end_date: endDate },
    }),

  // Analytics
  getConversionTrends: (period?: string, deviceType?: string, startDate?: string, endDate?: string) =>
    api.get("/analytics/conversion-trends", {
      params: { period, device_type: deviceType, start_date: startDate, end_date: endDate },
    }),

  getUserJourneyPatterns: (deviceType?: string, minSessions?: number) =>
    api.get("/analytics/user-journey", {
      params: { device_type: deviceType, min_sessions: minSessions },
    }),

  getCohortAnalysis: (cohortType?: string, deviceType?: string) =>
    api.get("/analytics/cohort", {
      params: { cohort_type: cohortType, device_type: deviceType },
    }),

  // Model operations
  refreshAnalytics: () => api.post("/analytics/refresh"),
  retrainModels: () => api.post("/models/retrain"),
}

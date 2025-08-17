import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"
import type {
  DashboardMetrics,
  FunnelAnalysis,
  SentimentAnalysis,
  ConversionTrend,
  UserJourneyPattern,
  CohortData,
} from "@/lib/types"

export function useDashboardMetrics(startDate?: string, endDate?: string) {
  // Default to 2015 data range since that's when our sample data is from
  const defaultStartDate = startDate || "2015-01-01"
  const defaultEndDate = endDate || "2015-12-31"
  
  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", defaultStartDate, defaultEndDate],
    queryFn: async () => {
      const response = await dashboardAPI.getDashboardMetrics(defaultStartDate, defaultEndDate)
      return response.data
    },
  })
}

export function useFunnelAnalysis(deviceType?: string, startDate?: string, endDate?: string) {
  // Default to 2015 data range since that's when our sample data is from
  const defaultStartDate = startDate || "2015-01-01"
  const defaultEndDate = endDate || "2015-12-31"
  
  return useQuery<FunnelAnalysis[]>({
    queryKey: ["funnel-analysis", deviceType, defaultStartDate, defaultEndDate],
    queryFn: async () => {
      const response = await dashboardAPI.getFunnelAnalysis(deviceType, defaultStartDate, defaultEndDate)
      return response.data
    },
  })
}

export function useSentimentAnalysis(page?: string, startDate?: string, endDate?: string) {
  // Default to 2015 data range since that's when our sample data is from
  const defaultStartDate = startDate || "2015-01-01"
  const defaultEndDate = endDate || "2015-12-31"
  
  return useQuery<SentimentAnalysis[]>({
    queryKey: ["sentiment-analysis", page, defaultStartDate, defaultEndDate],
    queryFn: async () => {
      const response = await dashboardAPI.getSentimentAnalysis(page, defaultStartDate, defaultEndDate)
      return response.data
    },
  })
}

export function useConversionTrends(period?: string, deviceType?: string, startDate?: string, endDate?: string) {
  // Default to 2015 data range since that's when our sample data is from
  const defaultStartDate = startDate || "2015-01-01"
  const defaultEndDate = endDate || "2015-12-31"
  
  return useQuery<ConversionTrend[]>({
    queryKey: ["conversion-trends", period, deviceType, defaultStartDate, defaultEndDate],
    queryFn: async () => {
      const response = await dashboardAPI.getConversionTrends(period, deviceType, defaultStartDate, defaultEndDate)
      return response.data
    },
  })
}

export function useUserJourneyPatterns(deviceType?: string, minSessions?: number) {
  return useQuery<UserJourneyPattern[]>({
    queryKey: ["user-journey-patterns", deviceType, minSessions],
    queryFn: async () => {
      const response = await dashboardAPI.getUserJourneyPatterns(deviceType, minSessions)
      return response.data
    },
  })
}

export function useCohortAnalysis(cohortType?: string, deviceType?: string) {
  return useQuery<CohortData[]>({
    queryKey: ["cohort-analysis", cohortType, deviceType],
    queryFn: async () => {
      const response = await dashboardAPI.getCohortAnalysis(cohortType, deviceType)
      return response.data
    },
  })
}

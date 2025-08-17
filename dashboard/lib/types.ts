export interface DashboardMetrics {
  total_users: number
  total_sessions: number
  overall_conversion_rate: number
  mobile_vs_desktop_conversion: Record<string, number>
  top_drop_off_points: DropoffPoint[]
  daily_metrics: DailyMetric[]
  sentiment_distribution: Record<string, number>
}

export interface FunnelStep {
  step: string
  total_users: number
  conversion_rate: number
  drop_off_rate: number
  avg_time_spent?: number
}

export interface FunnelAnalysis {
  device_type: string
  total_users: number
  steps: FunnelStep[]
  overall_conversion_rate: number
}

export interface DropoffPoint {
  from_step: string
  to_step: string
  dropoff_count: number
  dropoff_rate: number
  users_at_step: number
  users_continued: number
}

export interface UserBehavior {
  user_id: string
  device: string
  total_sessions: number
  total_interactions: number
  pages_visited: string[]
  conversion_completed: boolean
  sentiment_score?: number
}

export interface SentimentAnalysis {
  page: string
  overall_sentiment: number
  sentiment_distribution: Record<string, number>
  avg_confidence: number
  total_interactions: number
}

export interface ConversionTrend {
  date: string
  period: string
  total_sessions: number
  conversions: number
  unique_users: number
  conversion_rate: number
}

export interface DailyMetric {
  date: string
  sessions: number
  conversions: number
  unique_users: number
  conversion_rate: number
}

export interface SimilarUser {
  user_id: string
  similarity_score: number
  device: string
  conversion_completed: boolean
  total_sessions: number
}

export interface UserJourneyPattern {
  pattern: string[]
  frequency: number
  conversion_rate: number
  avg_session_duration: number
}

export interface CohortData {
  cohort: string
  period: number
  users: number
  retention_rate: number
}

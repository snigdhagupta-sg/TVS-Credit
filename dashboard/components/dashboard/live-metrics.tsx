"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Activity, Users, MousePointer } from "lucide-react"
import { useRealTimeData } from "@/hooks/use-real-time-data"
import { useDashboardMetrics } from "@/hooks/use-dashboard-data"
import { formatDistanceToNow } from "date-fns"

export function LiveMetrics() {
  const { isConnected, lastUpdate, updateCount } = useRealTimeData()
  const { data: dashboardData, isLoading } = useDashboardMetrics()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Metrics
          {isConnected && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Real-time dashboard metrics
          {lastUpdate && (
            <span className="ml-2 text-xs">
              • Last updated {formatDistanceToNow(lastUpdate)} ago ({updateCount} updates)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{dashboardData.total_users.toLocaleString()}</div>
                <div className="text-sm text-blue-600">Active Users</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <MousePointer className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-700">{dashboardData.total_sessions.toLocaleString()}</div>
                <div className="text-sm text-green-600">Live Sessions</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  {dashboardData.overall_conversion_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-600">Conversion Rate</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No live metrics available</div>
        )}

        {!isConnected && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Real-time connection unavailable</span>
            </div>
            <div className="text-xs text-yellow-600 mt-1">Data will refresh periodically instead of live updates</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

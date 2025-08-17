"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, MousePointer, Smartphone, Monitor } from "lucide-react"
import type { DashboardMetrics } from "@/lib/types"

interface OverviewStatsProps {
  data: DashboardMetrics
  loading?: boolean
}

export function OverviewStats({ data, loading }: OverviewStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_users.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Unique visitors</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <MousePointer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_sessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">User sessions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.overall_conversion_rate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Overall conversion</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Device Split</CardTitle>
          <div className="flex gap-1">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Badge variant="secondary">Desktop: {(data.mobile_vs_desktop_conversion.Desktop || 0).toFixed(1)}%</Badge>
            <Badge variant="outline">Mobile: {(data.mobile_vs_desktop_conversion.Mobile || 0).toFixed(1)}%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

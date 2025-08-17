"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingDown, AlertTriangle, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { DropoffPoint } from "@/lib/types"

interface DropoffAnalysisProps {
  data: DropoffPoint[]
  loading?: boolean
}

export function DropoffAnalysis({ data, loading }: DropoffAnalysisProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No drop-off data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatStepName = (step: string) => {
    return step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getDropoffSeverity = (rate: number) => {
    if (rate > 70) return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", severity: "Critical" }
    if (rate > 50)
      return { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", severity: "High" }
    if (rate > 30)
      return { color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", severity: "Medium" }
    return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", severity: "Low" }
  }

  // Prepare chart data
  const chartData = data.slice(0, 10).map((dropoff) => ({
    name: `${formatStepName(dropoff.from_step)} → ${formatStepName(dropoff.to_step)}`,
    dropoffRate: dropoff.dropoff_rate,
    dropoffCount: dropoff.dropoff_count,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Drop-off Analysis
          </CardTitle>
          <CardDescription>Critical points where users are leaving the funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === "dropoffRate" ? `${value.toFixed(1)}%` : value,
                    name === "dropoffRate" ? "Drop-off Rate" : "Users Lost",
                  ]}
                />
                <Bar dataKey="dropoffRate" fill="#ef4444" name="dropoffRate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Drop-off Points</CardTitle>
          <CardDescription>Ranked by drop-off rate and impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.slice(0, 10).map((dropoff, index) => {
              const severity = getDropoffSeverity(dropoff.dropoff_rate)

              return (
                <div
                  key={`${dropoff.from_step}-${dropoff.to_step}`}
                  className={`p-4 rounded-lg border ${severity.bg} ${severity.border}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <Badge variant="outline" className={severity.color}>
                          {severity.severity}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        {formatStepName(dropoff.from_step)} → {formatStepName(dropoff.to_step)}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${severity.color}`}>{dropoff.dropoff_rate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">drop-off rate</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Users at step: <span className="font-medium">{dropoff.users_at_step.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">
                        Users lost: <span className="font-medium">{dropoff.dropoff_count.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Continued: <span className="font-medium">{dropoff.users_continued.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <Progress value={100 - dropoff.dropoff_rate} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {(100 - dropoff.dropoff_rate).toFixed(1)}% of users successfully continued to the next step
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

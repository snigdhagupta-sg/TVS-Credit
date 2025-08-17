"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Route, TrendingUp, Clock, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { UserJourneyPattern } from "@/lib/types"

interface UserJourneyPatternsProps {
  data: UserJourneyPattern[]
  loading?: boolean
}

export function UserJourneyPatterns({ data, loading }: UserJourneyPatternsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No user journey patterns available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatStepName = (step: string) => {
    return step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getConversionColor = (rate: number) => {
    if (rate > 70) return "text-green-600"
    if (rate > 40) return "text-yellow-600"
    return "text-red-600"
  }

  // Prepare chart data
  const chartData = data.slice(0, 10).map((pattern, index) => ({
    name: `Pattern ${index + 1}`,
    frequency: pattern.frequency,
    conversionRate: pattern.conversion_rate,
    avgDuration: pattern.avg_session_duration,
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            User Journey Patterns
          </CardTitle>
          <CardDescription>Most common paths users take through your funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "frequency") return [value, "Frequency"]
                    if (name === "conversionRate") return [`${value.toFixed(1)}%`, "Conversion Rate"]
                    if (name === "avgDuration") return [`${Math.round(value)}s`, "Avg Duration"]
                    return [value, name]
                  }}
                />
                <Bar yAxisId="left" dataKey="frequency" fill="#3b82f6" name="frequency" />
                <Bar yAxisId="right" dataKey="conversionRate" fill="#10b981" name="conversionRate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Journey Patterns</CardTitle>
          <CardDescription>Step-by-step analysis of user journey patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.slice(0, 8).map((pattern, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Pattern #{index + 1}</Badge>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        <span className="font-medium">{pattern.frequency}</span> users
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getConversionColor(pattern.conversion_rate)}`}>
                        {pattern.conversion_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">conversion</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-700">{Math.round(pattern.avg_session_duration)}s</div>
                      <div className="text-xs text-gray-500">avg duration</div>
                    </div>
                  </div>
                </div>

                {/* Journey Steps */}
                <div className="flex items-center gap-2 flex-wrap">
                  {pattern.pattern.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatStepName(step)}
                      </Badge>
                      {stepIndex < pattern.pattern.length - 1 && <div className="text-gray-400 text-sm">→</div>}
                    </div>
                  ))}
                </div>

                {/* Pattern Metrics */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">
                      Frequency: <span className="font-medium">{pattern.frequency} users</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${getConversionColor(pattern.conversion_rate)}`} />
                    <span className="text-sm text-gray-600">
                      Conversion: <span className="font-medium">{pattern.conversion_rate.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Duration: <span className="font-medium">{Math.round(pattern.avg_session_duration)}s</span>
                    </span>
                  </div>
                </div>

                {/* Conversion Progress Bar */}
                <div className="mt-3">
                  <Progress value={pattern.conversion_rate} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {pattern.conversion_rate.toFixed(1)}% of users following this pattern convert
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

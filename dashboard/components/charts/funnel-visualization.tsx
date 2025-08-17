"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Clock, Users } from "lucide-react"
import type { FunnelAnalysis } from "@/lib/types"

interface FunnelVisualizationProps {
  data: FunnelAnalysis[]
  loading?: boolean
}

export function FunnelVisualization({ data, loading }: FunnelVisualizationProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-2 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data?.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No funnel data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStepIcon = (step: string) => {
    const icons: Record<string, string> = {
      home_page: "🏠",
      search_page: "🔍",
      product_page: "📦",
      payment_page: "💳",
      payment_confirmation_page: "✅",
      checkout_page: "🛒",
      signup_page: "📝",
    }
    return icons[step] || "📄"
  }

  const formatStepName = (step: string) => {
    return step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getDropoffColor = (rate: number) => {
    if (rate > 50) return "text-red-600"
    if (rate > 25) return "text-orange-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      {data.map((analysis) => (
        <Card key={analysis.device_type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Badge variant={analysis.device_type === "Desktop" ? "default" : "secondary"}>
                {analysis.device_type}
              </Badge>
              <span>Conversion Funnel</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({analysis.total_users.toLocaleString()} users)
              </span>
            </CardTitle>
            <CardDescription>
              Overall conversion rate:{" "}
              <span className="font-semibold text-green-600">{analysis.overall_conversion_rate.toFixed(1)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analysis.steps.map((step, index) => {
                const isFirst = index === 0
                const conversionFromPrevious = isFirst
                  ? 100
                  : (step.total_users / analysis.steps[index - 1].total_users) * 100

                return (
                  <div key={step.step} className="relative">
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getStepIcon(step.step)}</span>
                          <span className="font-medium text-gray-900">{formatStepName(step.step)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{step.total_users.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">users</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <Progress value={step.conversion_rate} className="h-3" />
                    </div>

                    {/* Step Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-gray-600">
                          Conversion: <span className="font-medium">{step.conversion_rate.toFixed(1)}%</span>
                        </span>
                      </div>

                      {!isFirst && (
                        <div className="flex items-center gap-2">
                          <TrendingDown className={`h-4 w-4 ${getDropoffColor(step.drop_off_rate)}`} />
                          <span className="text-sm text-gray-600">
                            Drop-off:{" "}
                            <span className={`font-medium ${getDropoffColor(step.drop_off_rate)}`}>
                              {step.drop_off_rate.toFixed(1)}%
                            </span>
                          </span>
                        </div>
                      )}

                      {step.avg_time_spent && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Avg time: <span className="font-medium">{Math.round(step.avg_time_spent)}s</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Step-to-step conversion */}
                    {!isFirst && (
                      <div className="text-xs text-gray-500 mb-4">
                        {conversionFromPrevious.toFixed(1)}% of users from previous step continued
                      </div>
                    )}

                    {/* Connector line to next step */}
                    {index < analysis.steps.length - 1 && (
                      <div className="absolute left-4 top-full w-0.5 h-6 bg-gray-200" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

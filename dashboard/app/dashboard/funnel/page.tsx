"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { FunnelVisualization } from "@/components/charts/funnel-visualization"
import { DropoffAnalysis } from "@/components/dashboard/dropoff-analysis"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useFunnelAnalysis } from "@/hooks/use-dashboard-data"
import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"
import { Filter, TrendingDown, Users, Target } from "lucide-react"

export default function FunnelPage() {
  const [deviceFilter, setDeviceFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  const {
    data: funnelData,
    isLoading: funnelLoading,
    refetch: refetchFunnel,
  } = useFunnelAnalysis(deviceFilter === "all" ? undefined : deviceFilter, dateRange.start, dateRange.end)

  const {
    data: dropoffData,
    isLoading: dropoffLoading,
    refetch: refetchDropoff,
  } = useQuery({
    queryKey: ["dropoff-analysis", deviceFilter],
    queryFn: async () => {
      const response = await dashboardAPI.getDropoffAnalysis(deviceFilter === "all" ? undefined : deviceFilter, 20)
      return response.data
    },
  })

  const handleRefresh = () => {
    refetchFunnel()
    refetchDropoff()
  }

  const handleExport = () => {
    console.log("Export funnel data")
  }

  // Calculate summary stats
  const summaryStats = funnelData?.reduce(
    (acc, analysis) => {
      acc.totalUsers += analysis.total_users
      acc.avgConversionRate += analysis.overall_conversion_rate
      return acc
    },
    { totalUsers: 0, avgConversionRate: 0 },
  )

  if (summaryStats && funnelData?.length) {
    summaryStats.avgConversionRate = summaryStats.avgConversionRate / funnelData.length
  }

  return (
    <>
      <Header
        title="Funnel Analysis"
        subtitle="Detailed conversion funnel analysis and drop-off insights"
        onRefresh={handleRefresh}
        onExport={handleExport}
        showDatePicker
      />
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Device Type</label>
                    <Select value={deviceFilter} onValueChange={setDeviceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Devices</SelectItem>
                        <SelectItem value="Desktop">Desktop</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {summaryStats && (
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{summaryStats.totalUsers.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summaryStats.avgConversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Avg Conversion</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="funnel" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="funnel" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Funnel View
              </TabsTrigger>
              <TabsTrigger value="dropoffs" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Drop-offs
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="funnel" className="space-y-4">
              <FunnelVisualization data={funnelData || []} loading={funnelLoading} />
            </TabsContent>

            <TabsContent value="dropoffs" className="space-y-4">
              <DropoffAnalysis data={dropoffData || []} loading={dropoffLoading} />
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Device Comparison</CardTitle>
                  <CardDescription>Compare conversion rates across different devices</CardDescription>
                </CardHeader>
                <CardContent>
                  {funnelData && funnelData.length > 1 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      {funnelData.map((analysis) => (
                        <div key={analysis.device_type} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant={analysis.device_type === "Desktop" ? "default" : "secondary"}>
                              {analysis.device_type}
                            </Badge>
                            <div className="text-right">
                              <div className="text-lg font-bold">{analysis.overall_conversion_rate.toFixed(1)}%</div>
                              <div className="text-sm text-gray-500">conversion rate</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {analysis.steps.map((step, index) => (
                              <div key={step.step} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Step {index + 1}: {step.step.replace(/_/g, " ")}
                                </span>
                                <span className="font-medium">{step.conversion_rate.toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">Select "All Devices" to see device comparison</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

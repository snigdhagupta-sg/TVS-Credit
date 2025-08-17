"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { LiveMetrics } from "@/components/dashboard/live-metrics"
import { RealTimeAlerts } from "@/components/dashboard/real-time-alerts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboardMetrics, useFunnelAnalysis, useConversionTrends } from "@/hooks/use-dashboard-data"
import { dashboardAPI } from "@/lib/api"

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useDashboardMetrics(dateRange.start, dateRange.end)

  const { data: funnelData, isLoading: funnelLoading } = useFunnelAnalysis()
  
  const { data: trendsData, isLoading: trendsLoading } = useConversionTrends("daily", undefined, dateRange.start, dateRange.end)

  const handleRefresh = async () => {
    try {
      await dashboardAPI.refreshAnalytics()
      refetchDashboard()
    } catch (error) {
      console.error("Failed to refresh analytics:", error)
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export functionality to be implemented")
  }

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle="Comprehensive funnel analysis and user behavior insights"
        onRefresh={handleRefresh}
        onExport={handleExport}
        showDatePicker
      />
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <LiveMetrics />
            <RealTimeAlerts />
          </div>

          {dashboardData && <OverviewStats data={dashboardData} loading={dashboardLoading} />}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="dropoffs">Drop-offs</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Conversion Trends</CardTitle>
                    <CardDescription>Daily conversion rates over the last 30 days</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : trendsData && trendsData.length > 0 ? (
                      <div className="h-[300px]">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{trendsData.length}</div>
                              <div className="text-xs text-gray-500">Data Points</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {(trendsData.reduce((sum, item) => sum + item.conversion_rate, 0) / trendsData.length).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">Avg Conversion</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">
                                {Math.max(...trendsData.map(item => item.conversion_rate)).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">Peak Rate</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">
                                {trendsData.reduce((sum, item) => sum + item.conversions, 0).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">Total Conversions</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Daily conversion trends showing {trendsData.length} days of data with rates ranging from {" "}
                            {Math.min(...trendsData.map(item => item.conversion_rate)).toFixed(1)}% to {" "}
                            {Math.max(...trendsData.map(item => item.conversion_rate)).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No conversion trends data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Drop-off Points</CardTitle>
                    <CardDescription>Where users are leaving the funnel most frequently</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData?.top_drop_off_points?.slice(0, 5).map((dropoff, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {dropoff.from_step} → {dropoff.to_step}
                            </p>
                            <p className="text-sm text-gray-600">{dropoff.dropoff_count} users dropped off</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{dropoff.dropoff_rate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">drop-off rate</p>
                          </div>
                        </div>
                      )) || <div className="text-center text-muted-foreground py-8">No drop-off data available</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Trends Analysis</CardTitle>
                  <CardDescription>Detailed trend analysis and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Advanced trend analysis will be implemented in the next phase
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dropoffs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Drop-off Analysis</CardTitle>
                  <CardDescription>Detailed analysis of where and why users drop off</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Drop-off analysis will be implemented in the next phase
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                  <CardDescription>Data-driven insights and recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">📊 Conversion Performance</h4>
                          <p className="text-sm text-blue-700">
                            Overall conversion rate is {dashboardData.overall_conversion_rate.toFixed(1)}%. 
                            {dashboardData.overall_conversion_rate < 5 
                              ? " This is below industry average and needs attention."
                              : " This is within expected range."
                            }
                          </p>
                        </div>
                        
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-900 mb-2">📱 Device Analysis</h4>
                          <p className="text-sm text-green-700">
                            {dashboardData.mobile_vs_desktop_conversion.Mobile > dashboardData.mobile_vs_desktop_conversion.Desktop
                              ? "Mobile users convert better than desktop users."
                              : "Desktop users convert better than mobile users."
                            } Consider optimizing the lower-performing platform.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <h4 className="font-medium text-purple-900 mb-2">👥 User Volume</h4>
                          <p className="text-sm text-purple-700">
                            Total of {dashboardData.total_users.toLocaleString()} users across {dashboardData.total_sessions.toLocaleString()} sessions.
                            Average sessions per user: {(dashboardData.total_sessions / dashboardData.total_users).toFixed(1)}
                          </p>
                        </div>
                        
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-900 mb-2">⚠️ Drop-off Points</h4>
                          <p className="text-sm text-orange-700">
                            {dashboardData.top_drop_off_points?.length > 0
                              ? `Primary drop-off point: ${dashboardData.top_drop_off_points[0].from_step} → ${dashboardData.top_drop_off_points[0].to_step} (${dashboardData.top_drop_off_points[0].dropoff_rate.toFixed(1)}%)`
                              : "No significant drop-off points identified."
                            }
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {trendsData && trendsData.length > 0 && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">📈 Trend Analysis</h4>
                        <p className="text-sm text-gray-700">
                          Over the analyzed period, conversion rates varied between{" "}
                          {Math.min(...trendsData.map(item => item.conversion_rate)).toFixed(1)}% and{" "}
                          {Math.max(...trendsData.map(item => item.conversion_rate)).toFixed(1)}%.
                          {Math.max(...trendsData.map(item => item.conversion_rate)) - Math.min(...trendsData.map(item => item.conversion_rate)) > 2
                            ? " High variability suggests opportunities for optimization."
                            : " Relatively stable conversion performance."
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

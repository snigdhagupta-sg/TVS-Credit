"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { SentimentAnalysisComponent } from "@/components/dashboard/sentiment-analysis"
import { SentimentChart } from "@/components/charts/sentiment-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSentimentAnalysis } from "@/hooks/use-dashboard-data"
import { MessageSquare, BarChart3, TrendingUp, Target } from "lucide-react"

export default function SentimentPage() {
  const [pageFilter, setPageFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({})

  const {
    data: sentimentData,
    isLoading: sentimentLoading,
    refetch: refetchSentiment,
  } = useSentimentAnalysis(pageFilter === "all" ? undefined : pageFilter, dateRange.start, dateRange.end)

  const handleRefresh = () => {
    refetchSentiment()
  }

  const handleExport = () => {
    console.log("Export sentiment data")
  }

  // Calculate summary stats
  const summaryStats = sentimentData
    ? {
        totalInteractions: sentimentData.reduce((sum, page) => sum + page.total_interactions, 0),
        avgSentiment: sentimentData.reduce((sum, page) => sum + page.overall_sentiment, 0) / sentimentData.length,
        avgConfidence: sentimentData.reduce((sum, page) => sum + page.avg_confidence, 0) / sentimentData.length,
        pagesAnalyzed: sentimentData.length,
        positivePages: sentimentData.filter((page) => page.overall_sentiment > 0.1).length,
        negativePages: sentimentData.filter((page) => page.overall_sentiment < -0.1).length,
      }
    : null

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.1) return "Positive"
    if (sentiment < -0.1) return "Negative"
    return "Neutral"
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return "text-green-600"
    if (sentiment < -0.1) return "text-red-600"
    return "text-gray-600"
  }

  // Get unique pages for filter
  const availablePages = sentimentData ? [...new Set(sentimentData.map((page) => page.page))] : []

  return (
    <>
      <Header
        title="Sentiment Analysis"
        subtitle="User sentiment analysis across pages and interactions"
        onRefresh={handleRefresh}
        onExport={handleExport}
        showDatePicker
      />
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Filters and Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Filters & Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Page Filter</label>
                    <Select value={pageFilter} onValueChange={setPageFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        {availablePages.map((page) => (
                          <SelectItem key={page} value={page}>
                            {page.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {summaryStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {summaryStats.totalInteractions.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Interactions</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getSentimentColor(summaryStats.avgSentiment)}`}>
                        {getSentimentLabel(summaryStats.avgSentiment)}
                      </div>
                      <div className="text-xs text-gray-500">Avg Sentiment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{summaryStats.positivePages}</div>
                      <div className="text-xs text-gray-500">Positive Pages</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{summaryStats.negativePages}</div>
                      <div className="text-xs text-gray-500">Negative Pages</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <SentimentAnalysisComponent data={sentimentData || []} loading={sentimentLoading} />
            </TabsContent>

            <TabsContent value="charts" className="space-y-4">
              <div className="grid gap-6">
                <SentimentChart data={sentimentData || []} loading={sentimentLoading} chartType="pie" />
                <SentimentChart data={sentimentData || []} loading={sentimentLoading} chartType="bar" />
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <SentimentChart data={sentimentData || []} loading={sentimentLoading} chartType="line" />
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Trends Over Time</CardTitle>
                  <CardDescription>Historical sentiment analysis and patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Time-based sentiment trends will be implemented with historical data
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                    <CardDescription>AI-powered sentiment insights and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sentimentData && sentimentData.length > 0 ? (
                        <>
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-blue-700">Overall Performance</span>
                            </div>
                            <p className="text-sm text-blue-600">
                              {summaryStats && summaryStats.avgSentiment > 0
                                ? "Your pages are performing well with positive user sentiment overall."
                                : summaryStats && summaryStats.avgSentiment < -0.1
                                  ? "There are opportunities to improve user sentiment across your pages."
                                  : "User sentiment is neutral with room for optimization."}
                            </p>
                          </div>

                          {summaryStats && summaryStats.negativePages > 0 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="h-4 w-4 text-red-500" />
                                <span className="font-medium text-red-700">Action Required</span>
                              </div>
                              <p className="text-sm text-red-600">
                                {summaryStats.negativePages} page(s) have negative sentiment. Consider reviewing user
                                feedback and optimizing the experience.
                              </p>
                            </div>
                          )}

                          {summaryStats && summaryStats.positivePages > 0 && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-green-700">Success Stories</span>
                              </div>
                              <p className="text-sm text-green-600">
                                {summaryStats.positivePages} page(s) have positive sentiment. Analyze what's working
                                well and replicate across other pages.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">No sentiment data available for insights</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>Actionable recommendations based on sentiment analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm mb-1">Monitor Negative Sentiment</div>
                        <div className="text-xs text-gray-600">
                          Set up alerts for pages with sentiment scores below -0.2
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm mb-1">A/B Test Improvements</div>
                        <div className="text-xs text-gray-600">
                          Test different content and layouts on pages with neutral sentiment
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm mb-1">Replicate Success</div>
                        <div className="text-xs text-gray-600">
                          Apply successful patterns from positive pages to underperforming ones
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

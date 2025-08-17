"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, MessageSquare, Target, AlertCircle } from "lucide-react"
import type { SentimentAnalysis } from "@/lib/types"

interface SentimentAnalysisProps {
  data: SentimentAnalysis[]
  loading?: boolean
}

export function SentimentAnalysisComponent({ data, loading }: SentimentAnalysisProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-16 bg-gray-200 rounded animate-pulse" />
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
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No sentiment analysis data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatPageName = (page: string) => {
    return page.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="h-5 w-5 text-green-500" />
    if (sentiment < -0.1) return <TrendingDown className="h-5 w-5 text-red-500" />
    return <Minus className="h-5 w-5 text-gray-500" />
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.1) return "Positive"
    if (sentiment < -0.1) return "Negative"
    return "Neutral"
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return "text-green-600 bg-green-50 border-green-200"
    if (sentiment < -0.1) return "text-red-600 bg-red-50 border-red-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "text-green-600"
    if (confidence > 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRecommendation = (page: SentimentAnalysis) => {
    if (page.overall_sentiment < -0.3) {
      return {
        type: "critical",
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        message: "Critical: High negative sentiment detected. Immediate attention required.",
        action: "Review user feedback and optimize page experience",
      }
    }
    if (page.overall_sentiment < -0.1) {
      return {
        type: "warning",
        icon: <TrendingDown className="h-4 w-4 text-orange-500" />,
        message: "Warning: Negative sentiment trend detected.",
        action: "Monitor closely and consider improvements",
      }
    }
    if (page.overall_sentiment > 0.3) {
      return {
        type: "success",
        icon: <TrendingUp className="h-4 w-4 text-green-500" />,
        message: "Excellent: High positive sentiment!",
        action: "Maintain current approach and replicate success",
      }
    }
    return {
      type: "neutral",
      icon: <Target className="h-4 w-4 text-blue-500" />,
      message: "Neutral sentiment. Room for improvement.",
      action: "Consider A/B testing to improve user experience",
    }
  }

  // Calculate overall statistics
  const totalInteractions = data.reduce((sum, page) => sum + page.total_interactions, 0)
  const avgSentiment = data.reduce((sum, page) => sum + page.overall_sentiment, 0) / data.length
  const avgConfidence = data.reduce((sum, page) => sum + page.avg_confidence, 0) / data.length

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Sentiment Analysis Overview
          </CardTitle>
          <CardDescription>Overall sentiment metrics across all pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">{getSentimentIcon(avgSentiment)}</div>
              <div className={`text-2xl font-bold ${getSentimentColor(avgSentiment).split(" ")[0]}`}>
                {getSentimentLabel(avgSentiment)}
              </div>
              <div className="text-sm text-gray-500">Overall Sentiment</div>
              <div className="text-xs text-gray-400 mt-1">Score: {avgSentiment.toFixed(3)}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalInteractions.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total Interactions</div>
              <div className="text-xs text-gray-400 mt-1">Across {data.length} pages</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getConfidenceColor(avgConfidence)}`}>
                {(avgConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Avg Confidence</div>
              <div className="text-xs text-gray-400 mt-1">Analysis reliability</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Page-by-Page Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Page-by-Page Sentiment Analysis</CardTitle>
          <CardDescription>Detailed sentiment breakdown for each page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data
              .sort((a, b) => b.total_interactions - a.total_interactions)
              .map((page) => {
                const recommendation = getRecommendation(page)
                const totalSentiments =
                  (page.sentiment_distribution.positive || 0) +
                  (page.sentiment_distribution.neutral || 0) +
                  (page.sentiment_distribution.negative || 0)

                return (
                  <div key={page.page} className={`border rounded-lg p-6 ${getSentimentColor(page.overall_sentiment)}`}>
                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{formatPageName(page.page)}</h3>
                        <Badge variant="outline" className={getSentimentColor(page.overall_sentiment)}>
                          {getSentimentLabel(page.overall_sentiment)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {page.total_interactions.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">interactions</div>
                      </div>
                    </div>

                    {/* Sentiment Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {page.sentiment_distribution.positive || 0}
                        </div>
                        <div className="text-sm text-gray-600">Positive</div>
                        <div className="text-xs text-gray-500">
                          {totalSentiments > 0
                            ? (((page.sentiment_distribution.positive || 0) / totalSentiments) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">
                          {page.sentiment_distribution.neutral || 0}
                        </div>
                        <div className="text-sm text-gray-600">Neutral</div>
                        <div className="text-xs text-gray-500">
                          {totalSentiments > 0
                            ? (((page.sentiment_distribution.neutral || 0) / totalSentiments) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">
                          {page.sentiment_distribution.negative || 0}
                        </div>
                        <div className="text-sm text-gray-600">Negative</div>
                        <div className="text-xs text-gray-500">
                          {totalSentiments > 0
                            ? (((page.sentiment_distribution.negative || 0) / totalSentiments) * 100).toFixed(1)
                            : 0}
                          %
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getConfidenceColor(page.avg_confidence)}`}>
                          {(page.avg_confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Confidence</div>
                        <div className="text-xs text-gray-500">Analysis quality</div>
                      </div>
                    </div>

                    {/* Sentiment Distribution Bar */}
                    <div className="mb-4">
                      <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${totalSentiments > 0 ? ((page.sentiment_distribution.positive || 0) / totalSentiments) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="bg-gray-400"
                          style={{
                            width: `${totalSentiments > 0 ? ((page.sentiment_distribution.neutral || 0) / totalSentiments) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${totalSentiments > 0 ? ((page.sentiment_distribution.negative || 0) / totalSentiments) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Overall sentiment score: {page.overall_sentiment.toFixed(3)}
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div
                      className={`p-3 rounded-lg border ${recommendation.type === "critical" ? "bg-red-50 border-red-200" : recommendation.type === "warning" ? "bg-orange-50 border-orange-200" : recommendation.type === "success" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        {recommendation.icon}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{recommendation.message}</div>
                          <div className="text-xs text-gray-600 mt-1">{recommendation.action}</div>
                        </div>
                      </div>
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

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { SentimentAnalysis } from "@/lib/types"

interface SentimentChartProps {
  data: SentimentAnalysis[]
  loading?: boolean
  chartType?: "pie" | "bar" | "line"
}

const SENTIMENT_COLORS = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#ef4444",
}

export function SentimentChart({ data, loading, chartType = "pie" }: SentimentChartProps) {
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
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="text-gray-400 mb-4">📊</div>
            <p className="text-gray-500">No sentiment data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatPageName = (page: string) => {
    return page.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (sentiment < -0.1) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

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

  // Prepare data for different chart types
  const pieData = data.flatMap((page) =>
    Object.entries(page.sentiment_distribution).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count,
      page: formatPageName(page.page),
      color: SENTIMENT_COLORS[sentiment as keyof typeof SENTIMENT_COLORS],
    })),
  )

  const barData = data.map((page) => ({
    page: formatPageName(page.page),
    positive: page.sentiment_distribution.positive || 0,
    neutral: page.sentiment_distribution.neutral || 0,
    negative: page.sentiment_distribution.negative || 0,
    overall: page.overall_sentiment,
    confidence: page.avg_confidence,
  }))

  const renderPieChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Distribution</CardTitle>
        <CardDescription>Overall sentiment breakdown across all pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, "Interactions"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  const renderBarChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment by Page</CardTitle>
        <CardDescription>Sentiment distribution across different pages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill={SENTIMENT_COLORS.positive} name="Positive" />
              <Bar dataKey="neutral" stackId="a" fill={SENTIMENT_COLORS.neutral} name="Neutral" />
              <Bar dataKey="negative" stackId="a" fill={SENTIMENT_COLORS.negative} name="Negative" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  const renderLineChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Trends</CardTitle>
        <CardDescription>Overall sentiment score trends by page</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="page" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[-1, 1]} />
              <Tooltip formatter={(value: number) => [value.toFixed(3), "Sentiment Score"]} />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 6 }}
                name="Overall Sentiment"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )

  if (chartType === "pie") return renderPieChart()
  if (chartType === "bar") return renderBarChart()
  if (chartType === "line") return renderLineChart()

  return renderPieChart()
}

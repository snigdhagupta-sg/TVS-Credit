"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingDown, Users, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRealTimeData } from "@/hooks/use-real-time-data"
import { formatDistanceToNow } from "date-fns"

interface Alert {
  id: string
  type: "critical" | "warning" | "info"
  title: string
  message: string
  timestamp: Date
  dismissed?: boolean
}

export function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const { lastMessage, isConnected } = useRealTimeData()

  // Mock alert generation based on real-time data
  useEffect(() => {
    if (lastMessage && isConnected) {
      // Generate alerts based on message type and data
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        type: "info",
        title: "Data Updated",
        message: `${lastMessage.type.replace("_", " ")} data has been updated`,
        timestamp: new Date(),
      }

      // Add more sophisticated alert logic here
      if (lastMessage.type === "funnel_analysis" && lastMessage.data?.conversion_rate < 5) {
        newAlert.type = "critical"
        newAlert.title = "Low Conversion Rate Alert"
        newAlert.message = "Conversion rate has dropped below 5%. Immediate attention required."
      } else if (lastMessage.type === "sentiment_analysis" && lastMessage.data?.sentiment < -0.5) {
        newAlert.type = "warning"
        newAlert.title = "Negative Sentiment Detected"
        newAlert.message = "User sentiment has become significantly negative on one or more pages."
      }

      setAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep only last 10 alerts
    }
  }, [lastMessage, isConnected])

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert)))
  }

  const clearAllAlerts = () => {
    setAlerts([])
  }

  const activeAlerts = alerts.filter((alert) => !alert.dismissed)
  const criticalAlerts = activeAlerts.filter((alert) => alert.type === "critical")
  const warningAlerts = activeAlerts.filter((alert) => alert.type === "warning")

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <TrendingDown className="h-4 w-4 text-orange-500" />
      default:
        return <Users className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-700"
      case "warning":
        return "bg-orange-50 border-orange-200 text-orange-700"
      default:
        return "bg-blue-50 border-blue-200 text-blue-700"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Real-time Alerts
              {activeAlerts.length > 0 && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {activeAlerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Live monitoring alerts and notifications
              {criticalAlerts.length > 0 && (
                <span className="ml-2 text-red-600 font-medium">• {criticalAlerts.length} critical</span>
              )}
              {warningAlerts.length > 0 && (
                <span className="ml-2 text-orange-600 font-medium">• {warningAlerts.length} warnings</span>
              )}
            </CardDescription>
          </div>
          {activeAlerts.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllAlerts}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activeAlerts.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs mt-1">{alert.message}</div>
                      <div className="text-xs mt-2 opacity-75">{formatDistanceToNow(alert.timestamp)} ago</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">
              {isConnected ? "System is monitoring for issues" : "Connect to real-time data to receive alerts"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

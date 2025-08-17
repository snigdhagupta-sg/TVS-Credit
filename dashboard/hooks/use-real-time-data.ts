"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useWebSocket } from "./use-websocket"

interface RealTimeUpdate {
  type: "dashboard_metrics" | "funnel_analysis" | "sentiment_analysis" | "user_behavior"
  data: any
  timestamp: string
}

export function useRealTimeData() {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false) // Disabled by default
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [updateCount, setUpdateCount] = useState(0)
  const queryClient = useQueryClient()

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws"

  // Disable WebSocket connection when real-time is disabled
  const { isConnected, connectionStatus, lastMessage } = useWebSocket(
    isRealTimeEnabled ? wsUrl : "", 
    {
    onMessage: (message) => {
      if (!isRealTimeEnabled) return

      const update = message as RealTimeUpdate
      setLastUpdate(new Date())
      setUpdateCount((prev) => prev + 1)

      // Invalidate relevant queries based on update type
      switch (update.type) {
        case "dashboard_metrics":
          queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
          break
        case "funnel_analysis":
          queryClient.invalidateQueries({ queryKey: ["funnel-analysis"] })
          queryClient.invalidateQueries({ queryKey: ["dropoff-analysis"] })
          break
        case "sentiment_analysis":
          queryClient.invalidateQueries({ queryKey: ["sentiment-analysis"] })
          break
        case "user_behavior":
          queryClient.invalidateQueries({ queryKey: ["user-behavior"] })
          queryClient.invalidateQueries({ queryKey: ["user-journey-patterns"] })
          queryClient.invalidateQueries({ queryKey: ["similar-users"] })
          break
      }
    },
    onConnect: () => {
      console.log("Real-time data connection established")
    },
    onDisconnect: () => {
      console.log("Real-time data connection lost")
    },
    onError: (error) => {
      console.error("Real-time data connection error:", error)
    },
  })

  const toggleRealTime = () => {
    setIsRealTimeEnabled(!isRealTimeEnabled)
  }

  return {
    isRealTimeEnabled,
    isConnected,
    connectionStatus,
    lastUpdate,
    updateCount,
    lastMessage,
    toggleRealTime,
  }
}

"use client"

import { useEffect, useRef, useState } from "react"

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const { onMessage, onConnect, onDisconnect, onError, reconnectInterval = 3000, maxReconnectAttempts = 5 } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
    "disconnected",
  )
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (!url) {
      setConnectionStatus("disconnected")
      setIsConnected(false)
      return
    }
    
    try {
      setConnectionStatus("connecting")
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        setIsConnected(true)
        setConnectionStatus("connected")
        setReconnectAttempts(0)
        onConnect?.()
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        setConnectionStatus("disconnected")
        onDisconnect?.()

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1)
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (error) => {
        setConnectionStatus("error")
        onError?.(error)
      }
    } catch (error) {
      setConnectionStatus("error")
      console.error("WebSocket connection error:", error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    ws.current?.close()
  }

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }

  useEffect(() => {
    if (url) {
      connect()
    } else {
      setConnectionStatus("disconnected")
      setIsConnected(false)
    }

    return () => {
      disconnect()
    }
  }, [url])

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    reconnectAttempts,
    sendMessage,
    connect,
    disconnect,
  }
}

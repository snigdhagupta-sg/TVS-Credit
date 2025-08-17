"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Wifi, WifiOff, RefreshCw, Pause, Play } from "lucide-react"
import { useRealTimeData } from "@/hooks/use-real-time-data"
import { formatDistanceToNow } from "date-fns"

export function RealTimeStatus() {
  const { isRealTimeEnabled, isConnected, connectionStatus, lastUpdate, updateCount, toggleRealTime } =
    useRealTimeData()

  const getStatusColor = () => {
    if (!isRealTimeEnabled) return "bg-gray-500"
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = () => {
    if (!isRealTimeEnabled) return "Paused"
    switch (connectionStatus) {
      case "connected":
        return "Live"
      case "connecting":
        return "Connecting"
      case "error":
        return "Error"
      default:
        return "Disconnected"
    }
  }

  const getStatusIcon = () => {
    if (!isRealTimeEnabled) return <Pause className="h-3 w-3" />
    if (isConnected) return <Wifi className="h-3 w-3" />
    return <WifiOff className="h-3 w-3" />
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${getStatusColor()} text-white border-transparent`}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className="text-xs">{getStatusText()}</span>
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div>Status: {getStatusText()}</div>
              <div>Updates: {updateCount}</div>
              {lastUpdate && <div>Last update: {formatDistanceToNow(lastUpdate)} ago</div>}
            </div>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={toggleRealTime} className="h-8 w-8 p-0 bg-transparent">
              {isRealTimeEnabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRealTimeEnabled ? "Pause real-time updates" : "Resume real-time updates"}</p>
          </TooltipContent>
        </Tooltip>

        {connectionStatus === "connecting" && <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />}
      </div>
    </TooltipProvider>
  )
}

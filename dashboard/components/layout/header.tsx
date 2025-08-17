"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Download, Calendar } from "lucide-react"
import { RealTimeStatus } from "./real-time-status"

interface HeaderProps {
  title: string
  subtitle?: string
  onRefresh?: () => void
  onExport?: () => void
  showDatePicker?: boolean
}

export function Header({ title, subtitle, onRefresh, onExport, showDatePicker }: HeaderProps) {
  return (
    <div className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <RealTimeStatus />
        {showDatePicker && (
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 30 days
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, Smartphone, Monitor, CheckCircle, XCircle, Eye } from "lucide-react"
import { useState } from "react"
import type { UserBehavior } from "@/lib/types"

interface UserBehaviorProps {
  data: UserBehavior[]
  loading?: boolean
  onViewUser?: (userId: string) => void
}

export function UserBehaviorComponent({ data, loading, onViewUser }: UserBehaviorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deviceFilter, setDeviceFilter] = useState("all")
  const [conversionFilter, setConversionFilter] = useState("all")

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter data based on search and filters
  const filteredData = data?.filter((user) => {
    const matchesSearch = user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDevice = deviceFilter === "all" || user.device === deviceFilter
    const matchesConversion =
      conversionFilter === "all" ||
      (conversionFilter === "converted" && user.conversion_completed) ||
      (conversionFilter === "not-converted" && !user.conversion_completed)

    return matchesSearch && matchesDevice && matchesConversion
  })

  const getSentimentColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score > 0.1) return "text-green-600"
    if (score < -0.1) return "text-red-600"
    return "text-yellow-600"
  }

  const getSentimentLabel = (score?: number) => {
    if (!score) return "Unknown"
    if (score > 0.1) return "Positive"
    if (score < -0.1) return "Negative"
    return "Neutral"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Behavior Analysis
        </CardTitle>
        <CardDescription>Individual user behavior patterns and conversion tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by User ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="Desktop">Desktop</SelectItem>
              <SelectItem value="Mobile">Mobile</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conversionFilter} onValueChange={setConversionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Conversion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="not-converted">Not Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredData?.length || 0} of {data?.length || 0} users
          </p>
        </div>

        {/* User Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Interactions</TableHead>
                <TableHead>Pages Visited</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData?.length ? (
                filteredData.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.user_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.device === "Desktop" ? (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        )}
                        <span>{user.device}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.total_sessions}</TableCell>
                    <TableCell>{user.total_interactions}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.pages_visited.slice(0, 3).map((page, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {page.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {user.pages_visited.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.pages_visited.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getSentimentColor(user.sentiment_score)} border-current`}>
                        {getSentimentLabel(user.sentiment_score)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.conversion_completed ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Converted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <span>Not Converted</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewUser?.(user.user_id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No users found matching your criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Search, Users, Smartphone, Monitor, CheckCircle, XCircle, Target } from "lucide-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"

interface SimilarUsersProps {
  selectedUserId?: string
  onSelectUser?: (userId: string) => void
}

export function SimilarUsers({ selectedUserId, onSelectUser }: SimilarUsersProps) {
  const [searchUserId, setSearchUserId] = useState(selectedUserId || "")
  const [currentUserId, setCurrentUserId] = useState(selectedUserId || "")

  const {
    data: similarUsers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["similar-users", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return []
      const response = await dashboardAPI.getSimilarUsers(currentUserId, 20)
      return response.data
    },
    enabled: !!currentUserId,
  })

  const handleSearch = () => {
    if (searchUserId.trim()) {
      setCurrentUserId(searchUserId.trim())
      onSelectUser?.(searchUserId.trim())
    }
  }

  const getSimilarityColor = (score: number) => {
    if (score > 0.8) return "text-green-600"
    if (score > 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getSimilarityLabel = (score: number) => {
    if (score > 0.8) return "High"
    if (score > 0.6) return "Medium"
    return "Low"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Similar Users Analysis
        </CardTitle>
        <CardDescription>Find users with similar behavior patterns using AI similarity matching</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter User ID to find similar users..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={!searchUserId.trim()}>
            Find Similar
          </Button>
        </div>

        {/* Results */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Error loading similar users</div>
            <p className="text-sm text-gray-500">Please check if the User ID exists and try again</p>
          </div>
        )}

        {!isLoading && !error && currentUserId && !similarUsers?.length && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No similar users found for ID: {currentUserId}</p>
          </div>
        )}

        {!currentUserId && !isLoading && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Enter a User ID to find similar users</p>
          </div>
        )}

        {similarUsers && similarUsers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">
                Similar users to: <span className="text-blue-600">{currentUserId}</span>
              </h4>
              <Badge variant="outline">{similarUsers.length} matches found</Badge>
            </div>

            <div className="space-y-3">
              {similarUsers.map((user) => (
                <div key={user.user_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{user.user_id}</div>
                      <div className="flex items-center gap-2">
                        {user.device === "Desktop" ? (
                          <Monitor className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm text-gray-600">{user.device}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getSimilarityColor(user.similarity_score)}`}>
                          {(user.similarity_score * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">similarity</div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getSimilarityColor(user.similarity_score)} border-current`}
                      >
                        {getSimilarityLabel(user.similarity_score)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        Sessions: <span className="font-medium">{user.total_sessions}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.conversion_completed ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Converted</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 font-medium">Not Converted</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Match: <span className="font-medium">{getSimilarityLabel(user.similarity_score)}</span>
                      </span>
                    </div>
                  </div>

                  <Progress value={user.similarity_score * 100} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {(user.similarity_score * 100).toFixed(1)}% behavioral similarity
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

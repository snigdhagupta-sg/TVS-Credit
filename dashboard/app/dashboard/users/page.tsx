"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { UserBehaviorComponent } from "@/components/dashboard/user-behavior"
import { UserJourneyPatterns } from "@/components/dashboard/user-journey-patterns"
import { SimilarUsers } from "@/components/dashboard/similar-users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"
import { dashboardAPI } from "@/lib/api"
import { Users, Route, Target, BarChart3 } from "lucide-react"

export default function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  // Mock user behavior data - in real app this would come from API
  const {
    data: userBehaviorData,
    isLoading: userBehaviorLoading,
    refetch: refetchUserBehavior,
  } = useQuery({
    queryKey: ["user-behavior"],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return [
        {
          user_id: "user_001",
          device: "Desktop",
          total_sessions: 5,
          total_interactions: 23,
          pages_visited: ["home_page", "search_page", "payment_page"],
          conversion_completed: true,
          sentiment_score: 0.8,
        },
        {
          user_id: "user_002",
          device: "Mobile",
          total_sessions: 3,
          total_interactions: 12,
          pages_visited: ["home_page", "search_page"],
          conversion_completed: false,
          sentiment_score: -0.2,
        },
        {
          user_id: "user_003",
          device: "Desktop",
          total_sessions: 8,
          total_interactions: 45,
          pages_visited: ["home_page", "search_page", "payment_page", "payment_confirmation_page"],
          conversion_completed: true,
          sentiment_score: 0.6,
        },
      ]
    },
  })

  const {
    data: journeyPatternsData,
    isLoading: journeyPatternsLoading,
    refetch: refetchJourneyPatterns,
  } = useQuery({
    queryKey: ["user-journey-patterns"],
    queryFn: async () => {
      const response = await dashboardAPI.getUserJourneyPatterns()
      return response.data
    },
  })

  const handleRefresh = () => {
    refetchUserBehavior()
    refetchJourneyPatterns()
  }

  const handleExport = () => {
    console.log("Export user behavior data")
  }

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
  }

  // Calculate summary stats
  const summaryStats = userBehaviorData
    ? {
        totalUsers: userBehaviorData.length,
        convertedUsers: userBehaviorData.filter((u) => u.conversion_completed).length,
        avgSessions: userBehaviorData.reduce((acc, u) => acc + u.total_sessions, 0) / userBehaviorData.length,
        mobileUsers: userBehaviorData.filter((u) => u.device === "Mobile").length,
      }
    : null

  return (
    <>
      <Header
        title="User Behavior Analytics"
        subtitle="Individual user analysis, journey patterns, and behavioral insights"
        onRefresh={handleRefresh}
        onExport={handleExport}
        showDatePicker
      />
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6">
          {/* Summary Stats */}
          {summaryStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Tracked users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((summaryStats.convertedUsers / summaryStats.totalUsers) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {summaryStats.convertedUsers} of {summaryStats.totalUsers} users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Sessions</CardTitle>
                  <Route className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.avgSessions.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Sessions per user</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mobile Users</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((summaryStats.mobileUsers / summaryStats.totalUsers) * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">{summaryStats.mobileUsers} mobile users</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="behavior" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Behavior
              </TabsTrigger>
              <TabsTrigger value="journeys" className="flex items-center gap-2">
                <Route className="h-4 w-4" />
                Journey Patterns
              </TabsTrigger>
              <TabsTrigger value="similar" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Similar Users
              </TabsTrigger>
              <TabsTrigger value="cohorts" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Cohort Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="behavior" className="space-y-4">
              <UserBehaviorComponent
                data={userBehaviorData || []}
                loading={userBehaviorLoading}
                onViewUser={handleViewUser}
              />
            </TabsContent>

            <TabsContent value="journeys" className="space-y-4">
              <UserJourneyPatterns data={journeyPatternsData || []} loading={journeyPatternsLoading} />
            </TabsContent>

            <TabsContent value="similar" className="space-y-4">
              <SimilarUsers selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} />
            </TabsContent>

            <TabsContent value="cohorts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cohort Analysis</CardTitle>
                  <CardDescription>User retention and behavior analysis by cohorts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    Cohort analysis will be implemented in the next phase
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

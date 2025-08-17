"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Funnel Analytics Dashboard</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

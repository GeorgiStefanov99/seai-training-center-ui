"use client"

import { useAuth } from "@/hooks/useAuth"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      {/* Blank page */}
    </div>
  )
}

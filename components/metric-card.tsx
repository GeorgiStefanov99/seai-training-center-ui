"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: LucideIcon
  iconColor?: string
}

export function MetricCard({ title, value, subtitle, icon: Icon, iconColor = "text-blue-600" }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


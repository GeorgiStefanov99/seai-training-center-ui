"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MaskedPersonalIdProps {
  personalId?: string
  label?: string
}

export function MaskedPersonalId({ personalId, label = "Personal ID" }: MaskedPersonalIdProps) {
  const [showPersonalId, setShowPersonalId] = useState(false)
  
  if (!personalId) return null
  
  const maskedId = personalId.replace(/./g, '*')
  
  return (
    <div className="flex items-center gap-2 text-sm">
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className="font-medium">{showPersonalId ? personalId : maskedId}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 p-0"
        onClick={() => setShowPersonalId(!showPersonalId)}
        title={showPersonalId ? "Hide Personal ID" : "Show Personal ID"}
      >
        {showPersonalId ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
        <span className="sr-only">{showPersonalId ? "Hide" : "Show"} Personal ID</span>
      </Button>
    </div>
  )
}

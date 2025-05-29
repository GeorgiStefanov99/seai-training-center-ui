"use client"

import { useEffect, useState } from "react"

export default function MouseMoveEffect() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 transition-opacity duration-300"
      style={{
        background: `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 102, 255, 0.2), transparent 80%)`,
      }}
    />
  )
}

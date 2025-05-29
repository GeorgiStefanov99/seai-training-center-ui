"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface TypewriterEffectProps {
  text: string
  delay?: number
  cycleDelay?: number
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ text, delay = 100, cycleDelay = 60000 }) => {
  const [displayText, setDisplayText] = useState("")
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let timer: NodeJS.Timeout
    let currentIndex = 0

    const typeText = () => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1))
        currentIndex++
        timer = setTimeout(typeText, delay)
      } else {
        // After typing is complete, wait 5 seconds and then fade out
        timer = setTimeout(() => {
          setIsVisible(false)
          // After fade out, wait remaining time to complete the cycle
          timer = setTimeout(
            () => {
              setDisplayText("")
              setIsVisible(true)
              currentIndex = 0
              typeText()
            },
            cycleDelay - 5000 - text.length * delay,
          )
        }, 5000)
      }
    }

    typeText()

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [text, delay, cycleDelay])

  return (
    <div
      className={`font-mono text-lg md:text-xl text-[#0066FF] transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {displayText}
      <span className="inline-block w-0.5 h-5 ml-1 bg-[#0066FF] animate-blink" />
    </div>
  )
}

export default TypewriterEffect

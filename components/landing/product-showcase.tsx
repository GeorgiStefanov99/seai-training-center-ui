"use client"

import { useState } from "react"
import Image from "next/image"

type View = "training" | "vessel" | "course" | "analytics" | "profile"

export default function ProductShowcase() {
  const [activeView, setActiveView] = useState<View>("training")

  const cycleView = () => {
    setActiveView((current) => {
      switch (current) {
        case "training":
          return "vessel"
        case "vessel":
          return "course"
        case "course":
          return "analytics"
        case "analytics":
          return "profile"
        case "profile":
          return "training"
      }
    })
  }

  const getPosition = (view: View) => {
    const positions = {
      training: 0,
      vessel: 1,
      course: 2,
      analytics: 3,
      profile: 4,
    }

    const currentPos = positions[activeView]
    const targetPos = positions[view]
    const diff = (targetPos - currentPos + 5) % 5

    if (diff === 0) {
      return "translate-x-0 translate-y-0 scale-100 opacity-100 rotate-0 z-50"
    }

    const offsets = {
      1: "translate-x-8 translate-y-4 scale-95 opacity-80 rotate-2 z-40",
      2: "translate-x-16 translate-y-8 scale-90 opacity-60 rotate-4 z-30",
      3: "translate-x-24 translate-y-12 scale-85 opacity-40 rotate-6 z-20",
      4: "translate-x-32 translate-y-16 scale-80 opacity-20 rotate-8 z-10",
    }

    return offsets[diff as 1 | 2 | 3 | 4] || offsets[4]
  }

  const getContent = () => {
    switch (activeView) {
      case "training":
        return {
          title: "Training Marketplace",
          description:
            "Our comprehensive training marketplace enables maritime companies to efficiently manage crew certifications and training requirements.",
          features: [
            "Advanced filtering and search",
            "Real-time availability tracking",
            "Global training provider network",
            "Automated certification management",
          ],
        }
      case "vessel":
        return {
          title: "Vessel Management",
          description:
            "Keep track of your entire fleet with our comprehensive vessel management system. Monitor locations, status, and vital statistics in real-time.",
          features: [
            "Real-time vessel tracking",
            "Fleet status monitoring",
            "Maintenance scheduling",
            "Performance analytics",
          ],
        }
      case "course":
        return {
          title: "Course Management",
          description:
            "Efficiently manage course participants, track attendance, and handle certifications with our intuitive course management system.",
          features: [
            "Participant enrollment tracking",
            "Attendance management",
            "Certification issuance",
            "Bulk participant actions",
          ],
        }
      case "analytics":
        return {
          title: "Cost Analytics",
          description:
            "Track and analyze crew costs with powerful visualization tools. Monitor trends, identify opportunities for optimization, and stay within budget.",
          features: [
            "Real-time cost tracking",
            "Budget monitoring",
            "Cost trend analysis",
            "Comparative fleet analytics",
          ],
        }
      case "profile":
        return {
          title: "Crew Profiles",
          description:
            "Comprehensive crew member profiles with detailed history, certifications, and performance metrics for informed decision-making.",
          features: [
            "Risk assessment tracking",
            "Contract management",
            "Performance monitoring",
            "Certification tracking",
          ],
        }
    }
  }

  const content = getContent()

  return (
    <section
      id="solutions"
      className="py-24 md:py-32 bg-gradient-to-b from-background via-background/50 to-background/80"
    >
      <div className="container max-w-screen-xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left column - Text content */}
          <div className="space-y-6 sticky top-24">
            <h2 className="text-3xl font-bold">Solutions</h2>
            <p className="text-muted-foreground text-lg">
              Experience how SeAI transforms maritime crew management with our intelligent platform
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{content.title}</h3>
                <p className="text-muted-foreground">{content.description}</p>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                {content.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button onClick={cycleView} className="text-sm text-[#0066FF] hover:text-[#0066FF]/80 transition-colors">
                View Next Feature →
              </button>
            </div>
          </div>

          {/* Right column - Product screenshots */}
          <div className="relative h-[600px] perspective">
            {/* Container for mockups */}
            <div className="relative w-full h-full cursor-pointer" onClick={cycleView}>
              {/* Training Marketplace mockup */}
              <div
                className={`absolute inset-0 rounded-lg overflow-hidden border border-border/50 shadow-lg transition-all duration-500 ease-in-out ${getPosition("training")}`}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-T2p1k2V5EuIT3Dkvbnu3YjZ4sr4x12.png"
                  alt="SeAI Training Marketplace Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* Vessel Management mockup */}
              <div
                className={`absolute inset-0 rounded-lg overflow-hidden border border-border/50 shadow-lg transition-all duration-500 ease-in-out ${getPosition("vessel")}`}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-uvWDlWeaLBkimz09PY0FOj6prtRaCv.png"
                  alt="SeAI Vessel Management Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>

              {/* Course Management mockup */}
              <div
                className={`absolute inset-0 rounded-lg overflow-hidden border border-border/50 shadow-lg transition-all duration-500 ease-in-out ${getPosition("course")}`}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-HAmiChHcuBmh5jUP3ylp4FUlESat6S.png"
                  alt="SeAI Course Management Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>

              {/* Cost Analytics mockup */}
              <div
                className={`absolute inset-0 rounded-lg overflow-hidden border border-border/50 shadow-lg transition-all duration-500 ease-in-out ${getPosition("analytics")}`}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yxPqd8YNdhaZH0053iuTnqKiTQI5oZ.png"
                  alt="SeAI Cost Analytics Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>

              {/* Crew Profile mockup */}
              <div
                className={`absolute inset-0 rounded-lg overflow-hidden border border-border/50 shadow-lg transition-all duration-500 ease-in-out ${getPosition("profile")}`}
              >
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-SnScmo45pVIrgGmeCxQZ9MR4CH8EBw.png"
                  alt="SeAI Crew Profile Interface"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute -inset-x-4 -inset-y-4 z-[-1] bg-gradient-to-r from-primary/5 via-accent/5 to-background rounded-xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

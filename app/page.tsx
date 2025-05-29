"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/landing/navbar"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import ProductShowcase from "@/components/landing/product-showcase"
import CTA from "@/components/landing/cta"
import Footer from "@/components/landing/footer"
import MouseMoveEffect from "@/components/landing/mouse-move-effect"
import { useAuth } from "@/hooks/useAuth"

export default function RootPage() {
  const { user } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user?.isAuthenticated) {
      router.push("/dashboard")
    }
  }, [user, router])

  // If user is authenticated, don't render the landing page content
  // This prevents a flash of the landing page before redirect
  if (user?.isAuthenticated) {
    return null
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[100px]" />
      </div>

      <MouseMoveEffect />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <ProductShowcase />
        <Features />
        <CTA />
        <Footer />
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export default function CTA() {
  const { user } = useAuth()
  const isAuthenticated = user?.isAuthenticated

  return (
    <section className="border-t">
      <div className="container max-w-screen-xl mx-auto flex flex-col items-center gap-4 py-24 text-center md:py-32 px-4 md:px-6">
        <h2 className="font-bold text-3xl leading-[1.1] sm:text-3xl md:text-5xl">Ready to harness the power of AI?</h2>
        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
          Join leading companies who trust SeAI to drive their AI-powered transformation and stay ahead in the rapidly
          evolving tech landscape.
        </p>
        {isAuthenticated ? (
          <Link href="/dashboard">
            <Button size="lg" className="mt-4 bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
              Go to Dashboard
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button size="lg" className="mt-4 bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
              Get Started Today
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}

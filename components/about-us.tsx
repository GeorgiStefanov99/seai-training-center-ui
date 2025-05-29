import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import MouseMoveEffect from "@/components/landing/mouse-move-effect"

const teamMembers = [
  {
    name: "Viktor",
    position: "CEO",
    brief:
      "Drawing from over 15 years of experience in commercial ship management with global market leaders, Viktor spearheads SeAI's vision and strategy. A management graduate from MDX Business School, London, he brings a wealth of industry knowledge and leadership expertise to our team.",
    image: "/placeholder.svg",
  },
  {
    name: "Georgi",
    position: "Software Engineer",
    brief:
      "Georgi's expertise in software engineering drives the development of robust and efficient solutions for our clients. Anything he touches from scratch turns into an amazing product. A graduate of Telerik Academy, along with several advanced tech programs, Georgi continuously expands his knowledge to stay at the forefront of modern software development.",
    image: "/placeholder.svg",
  },
  {
    name: "Kris",
    position: "CTO",
    brief:
      "Kris brings over 8 years of experience to SeAI. Specializing in the development of high-performance applications, he is setting the overall technical strategy for our product. Kris has graduated as Software Engineer from UCL.",
    image: "/placeholder.svg",
  },
  {
    name: "Bojo",
    position: "CAIO",
    brief:
      "As our Data, and LLM expert, Bojo leads SeAI's technological advancements, shaping our approach to automation and intelligent systems. With a PhD from UCL, he brings deep expertise in AI-driven solutions, ensuring our platform continuously evolves to meet the needs of the maritime industry.",
    image: "/placeholder.svg",
  },
]

export default function AboutUs() {
  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-screen-xl mx-auto px-4 md:px-6 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 pl-0 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">About SeAI</h1>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl text-muted-foreground">
              Our mission is to transform challenges into solutions, allowing you to focus on what truly matters. By
              streamlining and optimizing crew management processes, we empower maritime operations to be more
              efficient, sustainable, and future-ready.
            </p>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative w-full h-64">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      style={{ objectFit: "cover" }}
                      className="transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{member.position}</p>
                    <p className="text-sm text-muted-foreground">{member.brief}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-muted-foreground">
                  We constantly push the boundaries of what's possible in maritime AI technology.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Safety</h3>
                <p className="text-muted-foreground">We prioritize the safety of maritime operations in everything we do.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
                <p className="text-muted-foreground">
                  We're committed to making the maritime industry more environmentally friendly.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="mt-8 text-center">
          <Link href="/">
            <Button className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
      
      <MouseMoveEffect />
    </div>
  )
}

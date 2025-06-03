"use client"

import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Video, Construction } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnlineCoursesPage() {
  const router = useRouter()
  
  return (
    <PageLayout title="Online Courses">
      <div className="flex flex-col items-center justify-center py-12">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto bg-muted rounded-full p-4 mb-4">
              <Construction className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Feature Under Development</CardTitle>
            <CardDescription className="text-lg">
              Online Courses functionality is coming soon
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              We're working hard to bring you a comprehensive online learning experience.
              This feature will allow you to create, manage, and deliver courses online
              to seafarers around the world.
            </p>
            
            <div className="flex flex-col space-y-2">
              <h3 className="font-medium">Coming features:</h3>
              <ul className="list-disc list-inside text-left mx-auto inline-block">
                <li>Live webinar sessions</li>
                <li>Pre-recorded course materials</li>
                <li>Interactive assessments</li>
                <li>Digital certificates</li>
                <li>Progress tracking</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => router.push("/courses")}
              className="mt-6"
              variant="outline"
            >
              <Video className="mr-2 h-4 w-4" />
              Return to In-Person Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

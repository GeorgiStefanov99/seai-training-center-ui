"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { getDashboardData, DashboardData } from "@/services/dashboardService"
import { toast } from "sonner"
import { Loader2, Users, CalendarDays, Clock, Award, ArrowRight, ExternalLink, Edit, ChevronRight } from "lucide-react"

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    if (trainingCenterId) {
      fetchDashboardData()
    }
  }, [trainingCenterId])
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const data = await getDashboardData({ trainingCenterId })
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      toast.error('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Helper function to get initials from name
  const getInitials = (fullName: string) => {
    if (!fullName) return "?"
    const names = fullName.split(' ')
    return names.map(name => name.charAt(0)).join('')
  }
  
  // Helper function to format rank labels
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, ' ')
  }
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']
  const STATUS_COLORS = {
    WAITING: '#FFCA28',
    ENROLLED: '#66BB6A',
    CANCELLED: '#EF5350',
    SCHEDULED: '#42A5F5',
    IN_PROGRESS: '#AB47BC',
    COMPLETED: '#26A69A'
  }
  
  // Navigate to attendee details
  const navigateToAttendee = (attendeeId: string) => {
    router.push(`/attendees/attendee-detail?id=${attendeeId}`)
  }
  
  // Navigate to course template details
  const navigateToCourseTemplate = (templateId: string) => {
    router.push(`/course-templates/detail?id=${templateId}`)
  }
  
  // Navigate to course details
  const navigateToCourse = (courseId: string) => {
    router.push(`/courses/course-detail?id=${courseId}`)
  }
  
  // Render loading skeleton
  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    )
  }
  
  // If no data is available
  if (!dashboardData) {
    return (
      <PageLayout title="Dashboard" description="Training Center Overview">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Dashboard Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            We couldn't load your dashboard data. This could be due to a connection issue or because your training center is new.
          </p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </PageLayout>
    )
  }
  
  // Destructure dashboard data for easier access
  const { metrics, recentWaitlist, upcomingCourses, recentEnrollments, rankDistribution } = dashboardData
  
  // Prepare data for waitlist status chart
  const waitlistStatusData = [
    { name: 'Waiting', value: metrics.waitingCount, color: STATUS_COLORS.WAITING },
    { name: 'Enrolled', value: metrics.enrolledCount, color: STATUS_COLORS.ENROLLED },
    { name: 'Cancelled', value: metrics.cancelledCount, color: STATUS_COLORS.CANCELLED }
  ]
  
  // Prepare data for rank distribution chart
  const rankData = rankDistribution.map((item, index) => ({
    name: formatRank(item.rank),
    value: item.count,
    color: COLORS[index % COLORS.length]
  }))
  
  return (
    <PageLayout title="Dashboard">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Attendees */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">{metrics.totalAttendees}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Attendees</p>
          </CardContent>
        </Card>
        
        {/* Courses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">{metrics.totalCourses}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total Courses</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                {metrics.activeCourses} Active
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
                {metrics.upcomingCourses} Upcoming
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Waitlist */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-xl font-bold">{metrics.waitlistCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Waitlist Records</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                {metrics.waitingCount} Waiting
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Capacity Utilization */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold">{metrics.capacityUtilization}%</span>
              <span className="text-sm text-muted-foreground">Capacity</span>
            </div>
            <Progress value={metrics.capacityUtilization} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-2">Course Capacity Utilization</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Waitlist Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Waitlist Summary</CardTitle>
            <CardDescription>Recent waitlist activity and status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Waitlist Status Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-4">Status Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={waitlistStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {waitlistStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Recent Waitlist Records */}
            <h4 className="text-sm font-medium mb-4">Recent Waitlist Records</h4>
            <div className="space-y-4">
              {recentWaitlist.slice(0, 3).map((record) => (
                <div key={record.id} className="flex items-start gap-4 p-3 rounded-lg border">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(`${record.attendeeResponse.name} ${record.attendeeResponse.surname}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{record.attendeeResponse.name} {record.attendeeResponse.surname}</p>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${record.status === 'WAITING' ? 'bg-yellow-50 text-yellow-700' : ''}
                          ${record.status === 'ENROLLED' ? 'bg-green-50 text-green-700' : ''}
                          ${record.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : ''}
                        `}
                      >
                        {record.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{record.courseTemplateId}</p>
                    <p className="text-xs text-muted-foreground">Added on {formatDate(record.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/waitlist">View All Waitlist Records <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Attendee Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Attendee Activity</CardTitle>
            <CardDescription>Recent enrollments and rank distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Rank Distribution Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-4">Rank Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={rankData.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Attendees">
                    {rankData.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Recent Enrollments */}
            <h4 className="text-sm font-medium mb-4">Recent Enrollments</h4>
            <div className="space-y-4">
              {recentEnrollments.slice(0, 3).map((enrollment) => (
                <div key={enrollment.id} className="flex items-start gap-4 p-3 rounded-lg border">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(enrollment.attendeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{enrollment.attendeeName}</p>
                    <p className="text-xs text-muted-foreground">{formatRank(enrollment.attendeeRank)}</p>
                    <p className="text-xs text-muted-foreground">Enrolled in {enrollment.courseName}</p>
                    <p className="text-xs text-muted-foreground">on {formatDate(enrollment.enrollmentDate)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => navigateToAttendee(enrollment.attendeeId)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/attendees">View All Attendees <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Course Schedule Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upcoming Courses</CardTitle>
          <CardDescription>Next 30 days schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {upcomingCourses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border">
                <div className="flex-1">
                  <h4 className="text-base font-medium">{course.name}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(course.startDate)} - {formatDate(course.endDate)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${course.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' : ''}
                        ${course.status === 'IN_PROGRESS' ? 'bg-purple-50 text-purple-700' : ''}
                        ${course.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : ''}
                        ${course.status === 'CANCELLED' ? 'bg-red-50 text-red-700' : ''}
                      `}
                    >
                      {course.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{course.enrolledAttendees}/{course.maxSeats}</span>
                    <span className="text-xs text-muted-foreground">seats filled</span>
                  </div>
                  <Progress 
                    value={(course.enrolledAttendees / course.maxSeats) * 100} 
                    className="h-2 w-full sm:w-24" 
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={() => navigateToCourse(course.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/courses">View All Courses <ChevronRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </CardFooter>
      </Card>
    </PageLayout>
  )
}

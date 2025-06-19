"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, subDays } from "date-fns"
import { DateRange } from "react-day-picker"

// Layout and UI components
import { PageLayout } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect, Option } from "@/components/ui/multi-select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ScatterChart, Scatter
} from "recharts"

// Icons
import { 
  Loader2, DollarSign, TrendingUp, Calculator, Users, 
  Calendar, BarChart2, PieChart as PieChartIcon,
  LineChart as LineChartIcon, FileText, Download 
} from "lucide-react"

// Service and data interfaces
import { 
  getFinancialDashboardData, 
  FinancialDashboardData,
  CourseFinancialData,
  AttendeePaymentData 
} from "@/services/financialDashboardService"
import { toast } from "sonner"

export default function FinancialDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<FinancialDashboardData | null>(null)
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: subDays(new Date(), 30), 
    to: new Date() 
  })
  const [courseTypeFilters, setCourseTypeFilters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [coursesPage, setCoursesPage] = useState(1)
  const [attendeesPage, setAttendeesPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Fetch dashboard data on component mount and when filters change
  useEffect(() => {
    if (trainingCenterId) {
      fetchDashboardData()
    }
  }, [trainingCenterId, dateRange?.from, dateRange?.to])
  
  // Function to fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Pass the selected date range to the API
      const data = await getFinancialDashboardData({ 
        trainingCenterId,
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      })
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching financial dashboard data:', err)
      toast.error('Failed to load financial data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BGN' })
      .format(amount)
  }
  
  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1']
  
  // Get unique course types for the filter options
  const courseTypes = dashboardData?.courseFinancials
    ? Array.from(new Set(dashboardData.courseFinancials.map(course => course.type)))
        .map(type => ({ label: type, value: type }))
    : []

  // Filter course financials based on search term and selected course types
  const filteredCourses = dashboardData?.courseFinancials.filter(course => {
    const matchesSearch = searchTerm 
      ? course.name.toLowerCase().includes(searchTerm.toLowerCase()) 
      : true
    
    const matchesType = courseTypeFilters.length === 0 || courseTypeFilters.includes(course.type)
    
    return matchesSearch && matchesType
  }) || []
  
  // Filter attendee payments based on search term
  const filteredAttendees = dashboardData?.attendeePayments.filter(attendee => {
    return searchTerm 
      ? (attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (attendee.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      : true
  }) || []

  // Calculate total and average profit for filtered courses
  const totalProfit = filteredCourses.reduce((sum, course) => sum + course.profit, 0);
  const avgProfit = filteredCourses.length > 0 ? totalProfit / filteredCourses.length : 0;

  // Render loading skeleton if data is loading
  if (isLoading) {
    return (
      <PageLayout title="Financial Dashboard">
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
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    )
  }
  
  // Extract data for easier access
  const { summary, monthlyRevenue, yearlyRevenue, courseTypeRevenue } = dashboardData || {}
  
  return (
    <PageLayout title="Financial Dashboard">
      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 mb-6">
        <div className="flex flex-col space-y-1.5 w-full md:w-[300px]">
          <Label htmlFor="date-range">Time Period:</Label>
          <div className="flex gap-2">
            <DateRangePicker
              value={dateRange}
              onChange={(range: DateRange | undefined) => range && setDateRange(range)}
              className="w-full"
              placeholder="Select date range"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setDateRange({ from: undefined, to: undefined })}
              className="whitespace-nowrap mt-0.5"
            >
              Show All
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1.5 w-full md:w-[300px]">
          <Label htmlFor="course-type">Course Type:</Label>
          <MultiSelect
            options={[
              ...courseTypes
            ]}
            selected={courseTypeFilters}
            onChange={setCourseTypeFilters}
            placeholder="Select course types"
            emptyMessage="No course types found"
            className="w-full"
          />
        </div>
        
        <div className="flex-grow ml-auto">
          <Label htmlFor="search" className="mb-1.5">Search:</Label>
          <Input
            id="search"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[250px]"
          />
        </div>
        
        <Button variant="outline" className="ml-2">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h2 className="text-2xl font-bold">
                  {formatCurrency(summary?.totalRevenue || 0)}
                </h2>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                <h2 className="text-2xl font-bold">
                  {formatCurrency(summary?.totalProfit || 0)}
                </h2>
              </div>
              <div className="p-2 bg-green-500/10 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Conducted</p>
                <h2 className="text-2xl font-bold">
                  {summary?.totalCourses || 0}
                </h2>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Students/Course</p>
                <h2 className="text-2xl font-bold">
                  {summary?.avgStudentsPerCourse.toFixed(1) || 0}
                </h2>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-full">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Revenue Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Course Type Distribution</CardTitle>
            <CardDescription>Number of courses by type with percentage</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData?.courseTypeRevenue || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent, payload }) => `${name}: ${value} (${payload.percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="type"
                >
                  {dashboardData?.courseTypeRevenue?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    const entry = props.payload;
                    return [`${value} courses (${entry.percentage}% of total)`, name];
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>Monthly revenue and profit over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dashboardData?.monthlyRevenue || []}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'MMM yyyy');
                  }} 
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => format(new Date(label), 'MMMM yyyy')} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#0088FE" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke="#00C49F" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Profitable Courses Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Profitable Courses</CardTitle>
          <CardDescription>Most profitable courses by revenue and profit margin</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Profit summary row */}
          <div className="flex flex-wrap gap-6 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Total Profit:</span>
              <span className="text-lg font-bold">{formatCurrency(totalProfit)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">Average Profit:</span>
              <span className="text-lg font-bold">{formatCurrency(avgProfit)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Costs</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length > 0 ? (
                  filteredCourses
                    .sort((a, b) => b.profit - a.profit)
                    .slice((coursesPage - 1) * ITEMS_PER_PAGE, coursesPage * ITEMS_PER_PAGE)
                    .map((course, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>{course.type}</TableCell>
                        <TableCell>{formatDate(course.startDate)}</TableCell>
                        <TableCell>{course.attendeeCount}</TableCell>
                        <TableCell>{formatCurrency(course.totalRevenue)}</TableCell>
                        <TableCell>{formatCurrency(course.expenses)}</TableCell>
                        <TableCell>{formatCurrency(course.profit)}</TableCell>
                        <TableCell>
                          {/* Calculate profit margin from totalRevenue and expenses */}
                          <Badge className={`${(course.profit / course.totalRevenue) >= 0.3 ? 'bg-green-500' : (course.profit / course.totalRevenue) >= 0.15 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                            {((course.profit / course.totalRevenue) * 100).toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No courses found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredCourses.length, ITEMS_PER_PAGE)} of {filteredCourses.length} courses
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCoursesPage((prev) => Math.max(prev - 1, 1))}
              disabled={coursesPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCoursesPage((prev) => prev + 1)}
              disabled={coursesPage * ITEMS_PER_PAGE >= filteredCourses.length}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Attendee Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendee Payments</CardTitle>
          <CardDescription>Track attendee payments and outstanding balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Courses Taken</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.length > 0 ? (
                  filteredAttendees
                    .sort((a, b) => b.unpaidAmount - a.unpaidAmount)
                    .slice((attendeesPage - 1) * ITEMS_PER_PAGE, attendeesPage * ITEMS_PER_PAGE)
                    .map((attendee, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{attendee.name}</TableCell>
                        <TableCell>{attendee.email}</TableCell>
                        <TableCell>{attendee.courseCount}</TableCell>
                        <TableCell>{formatCurrency(attendee.totalPaid)}</TableCell>
                        <TableCell>{formatCurrency(attendee.unpaidAmount)}</TableCell>
                        <TableCell>{formatDate(attendee.lastPaymentDate)}</TableCell>
                        <TableCell>
                          {attendee.unpaidAmount > 0 ? (
                            <Badge variant="destructive">Payment Due</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Paid</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No attendees found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredAttendees.length, ITEMS_PER_PAGE)} of {filteredAttendees.length} attendees
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttendeesPage((prev) => Math.max(prev - 1, 1))}
              disabled={attendeesPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAttendeesPage((prev) => prev + 1)}
              disabled={attendeesPage * ITEMS_PER_PAGE >= filteredAttendees.length}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </PageLayout>
  )
}

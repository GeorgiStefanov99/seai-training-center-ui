"use client"

import React, { useState, useEffect, useMemo } from "react"
import { PageLayout } from "@/components/page-layout"
import { CustomTable } from "@/components/ui/custom-table"
import { Column } from "@/types/table"
import { CourseTemplate, ActiveCourse, WaitlistRecord } from "@/types/course-template"
import { getCourseTemplates, deleteCourseTemplate, getActiveCoursesForTemplate, getWaitlistRecordsForTemplate } from "@/services/courseTemplateService"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, Trash2, Search, ChevronRight, BookOpen, Clock } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { CourseTemplateDialog, DeleteCourseTemplateDialog } from "@/components/dialogs/course-template-dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function CourseTemplatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [templates, setTemplates] = useState<CourseTemplate[]>([])
  const [activeCoursesCount, setActiveCoursesCount] = useState<Record<string, number>>({})
  const [waitlistCount, setWaitlistCount] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<CourseTemplate | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || ""
  
  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    
    const query = searchQuery.toLowerCase().trim();
    return templates.filter(template => {
      // Search in all text fields
      return (
        template.name?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.currency?.toLowerCase().includes(query) ||
        template.price?.toString().includes(query) ||
        template.maxSeats?.toString().includes(query)
      );
    });
  }, [templates, searchQuery]);

  // Fetch templates and active courses count
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!trainingCenterId) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        const data = await getCourseTemplates(trainingCenterId)
        setTemplates(data)
        setError(null)
        
        // Fetch active courses count and waitlist count for each template
        const activeCoursesCounts: Record<string, number> = {}
        const waitlistCounts: Record<string, number> = {}
        
        await Promise.all(
          data.map(async (template) => {
            try {
              // Fetch active courses
              const activeCourses = await getActiveCoursesForTemplate({
                trainingCenterId,
                courseTemplateId: template.id
              })
              activeCoursesCounts[template.id] = activeCourses.length
              
              // Fetch waitlist records
              const waitlistRecords = await getWaitlistRecordsForTemplate({
                trainingCenterId,
                courseTemplateId: template.id
              })
              waitlistCounts[template.id] = waitlistRecords.length
            } catch (err) {
              console.error(`Error fetching data for template ${template.id}:`, err)
              activeCoursesCounts[template.id] = 0
              waitlistCounts[template.id] = 0
            }
          })
        )
        
        setActiveCoursesCount(activeCoursesCounts)
        setWaitlistCount(waitlistCounts)
      } catch (err) {
        console.error('Error fetching course templates:', err)
        setError('Failed to load course templates. Please try again later.')
        setTemplates([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [trainingCenterId])

  // Format currency for display
  const formatCurrency = (price: number, currency?: string) => {
    // If currency is null, undefined, or empty, default to USD
    const validCurrency = currency && currency.trim() ? currency : 'USD'
    
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })
      
      return formatter.format(price)
    } catch (error) {
      // Fallback formatting if there's an error
      console.error('Error formatting currency:', error)
      return `${price} ${validCurrency}`
    }
  }

  // Define table columns
  const columns: Column[] = [
    {
      key: "index",
      header: "#",
      cell: (_, index) => index + 1
    },
    {
      key: "name",
      header: "Name",
      accessorKey: "name"
    },
    {
      key: "price",
      header: "Price",
      cell: (row: CourseTemplate) => formatCurrency(row.price, row.currency)
    },
    {
      key: "maxSeats",
      header: "Max Seats",
      accessorKey: "maxSeats"
    },
    {
      key: "activeCourses",
      header: "Active Courses",
      cell: (row: CourseTemplate) => {
        const count = activeCoursesCount[row.id] || 0
        return (
          <Badge variant={count > 0 ? "default" : "outline"} className="whitespace-nowrap">
            <BookOpen className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        )
      }
    },
    {
      key: "waitlist",
      header: "Waitlist",
      cell: (row: CourseTemplate) => {
        const count = waitlistCount[row.id] || 0
        return (
          <Badge variant={count > 0 ? "success" : "outline"} className="whitespace-nowrap">
            <Clock className="h-3 w-3 mr-1" />
            {count}
          </Badge>
        )
      }
    },
    {
      key: "description",
      header: "Description",
      cell: (row: CourseTemplate) => (
        <div className="max-w-[300px] truncate" title={row.description}>
          {row.description || "No description"}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row: CourseTemplate) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation()
            handleEdit(row)
          }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => {
            e.stopPropagation()
            handleDelete(row)
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Refresh the templates list
  const refreshTemplates = async () => {
    if (!trainingCenterId) return
    
    try {
      setIsLoading(true)
      const data = await getCourseTemplates(trainingCenterId)
      setTemplates(data)
      setError(null)
      
      // Refresh active courses count and waitlist count
      const activeCoursesCounts: Record<string, number> = {}
      const waitlistCounts: Record<string, number> = {}
      
      await Promise.all(
        data.map(async (template) => {
          try {
            // Fetch active courses
            const activeCourses = await getActiveCoursesForTemplate({
              trainingCenterId,
              courseTemplateId: template.id
            })
            activeCoursesCounts[template.id] = activeCourses.length
            
            // Fetch waitlist records
            const waitlistRecords = await getWaitlistRecordsForTemplate({
              trainingCenterId,
              courseTemplateId: template.id
            })
            waitlistCounts[template.id] = waitlistRecords.length
          } catch (err) {
            console.error(`Error fetching data for template ${template.id}:`, err)
            activeCoursesCounts[template.id] = 0
            waitlistCounts[template.id] = 0
          }
        })
      )
      
      setActiveCoursesCount(activeCoursesCounts)
      setWaitlistCount(waitlistCounts)
    } catch (err) {
      console.error('Error refreshing course templates:', err)
      toast.error('Failed to refresh course templates list')
    } finally {
      setIsLoading(false)
    }
  }

  // Navigate to template detail page
  const navigateToTemplateDetail = (template: CourseTemplate) => {
    if (template.id) {
      router.push(`/course-templates/detail?id=${template.id}`)
    }
  }

  // Handler functions
  const handleAddNew = () => {
    setSelectedTemplate(undefined)
    setCreateDialogOpen(true)
  }

  const handleEdit = (template: CourseTemplate) => {
    setSelectedTemplate(template)
    setEditDialogOpen(true)
  }

  const handleDelete = (template: CourseTemplate) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }
  
  // Handle delete confirmation
  const handleDeleteConfirm = async (template: CourseTemplate) => {
    if (!trainingCenterId || !template.id) return
    
    setIsDeleting(true)
    try {
      await deleteCourseTemplate({
        trainingCenterId,
        courseTemplateId: template.id
      })
      toast.success(`${template.name} has been deleted`)
      await refreshTemplates()
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting course template:', error)
      toast.error('Failed to delete course template. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PageLayout title="Course Templates">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Manage Course Templates</h2>
              <p className="text-muted-foreground">Create and manage course templates for your training center</p>
            </div>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Template
            </Button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, description, price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-full md:w-[300px]"
            />
          </div>
        </div>
        
        <CustomTable
          columns={columns}
          data={filteredTemplates}
          isLoading={isLoading}
          rowRender={(row, index) => (
            <tr 
              key={row.id || index} 
              className="h-10 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigateToTemplateDetail(row)}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-2 py-1 text-xs">
                  {column.key === 'actions' ? (
                    // For the actions column, we want to prevent the row click event
                    <div onClick={(e) => e.stopPropagation()}>
                      {column.cell ? column.cell(row, index) : null}
                    </div>
                  ) : (
                    column.cell
                      ? column.cell(row, index)
                      : (column.accessorKey ? (row as any)[column.accessorKey] : null)
                  )}
                </td>
              ))}
              <td className="px-2 py-1 text-xs text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </td>
            </tr>
          )}
          emptyState={
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No course templates found</p>
              <Button variant="outline" onClick={handleAddNew}>
                Add your first course template
              </Button>
            </div>
          }
        />
        
        {/* Create Course Template Dialog */}
        <CourseTemplateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={refreshTemplates}
          mode="create"
        />
        
        {/* Edit Course Template Dialog */}
        <CourseTemplateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          template={selectedTemplate}
          onSuccess={refreshTemplates}
          mode="edit"
        />
        
        {/* Delete Course Template Dialog */}
        <DeleteCourseTemplateDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          template={selectedTemplate}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      </div>
    </PageLayout>
  )
}

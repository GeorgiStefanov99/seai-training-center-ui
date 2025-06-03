"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { Attendee } from "@/types/attendee"
import { getCourseAttendees, removeAttendeeFromCourse } from "@/services/courseAttendeeService"
import { Loader2, Search, UserPlus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CourseAttendeeDialog } from "./course-attendee-dialog"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"

// Define the component props
interface CourseAttendeesManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
  refreshData?: () => Promise<void>;
}

export function CourseAttendeesManagementDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
  refreshData
}: CourseAttendeesManagementDialogProps) {
  const { user } = useAuth();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  
  // Get training center ID from the authenticated user
  const trainingCenterId = user?.userId || "";

  // Fetch attendees
  const fetchAttendees = async () => {
    if (!trainingCenterId || !courseId) return;
    
    setIsLoading(true);
    try {
      const data = await getCourseAttendees({
        trainingCenterId,
        courseId
      });
      setAttendees(data);
      setFilteredAttendees(data);
    } catch (error) {
      console.error("Error fetching course attendees:", error);
      toast.error("Failed to load course attendees. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch attendees when the dialog opens
  useEffect(() => {
    if (open && trainingCenterId && courseId) {
      fetchAttendees();
    }
  }, [open, trainingCenterId, courseId]);

  // Filter attendees based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredAttendees(attendees);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = attendees.filter(
        (attendee) =>
          attendee.name?.toLowerCase().includes(query) ||
          attendee.surname?.toLowerCase().includes(query) ||
          attendee.email?.toLowerCase().includes(query) ||
          attendee.rank?.toLowerCase().includes(query)
      );
      setFilteredAttendees(filtered);
    }
  }, [searchQuery, attendees]);

  // Handle adding a new attendee
  const handleAddAttendee = () => {
    setAssignDialogOpen(true);
  };

  // Handle removing an attendee
  const handleRemoveAttendee = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setDeleteDialogOpen(true);
  };

  // Confirm attendee removal
  const confirmRemoveAttendee = async () => {
    if (!selectedAttendee || !trainingCenterId || !courseId) {
      setDeleteDialogOpen(false);
      setSelectedAttendee(null);
      return;
    }
    
    try {
      await removeAttendeeFromCourse({
        trainingCenterId,
        courseId,
        attendeeId: selectedAttendee.id
      });
      
      toast.success(`${selectedAttendee.name} ${selectedAttendee.surname} removed from course successfully`);
      
      // Fetch updated attendees list
      try {
        await fetchAttendees();
      } catch (fetchError) {
        console.error("Error fetching updated attendees:", fetchError);
      }
      
      // Close the dialog and refresh parent data if needed
      if (refreshData) {
        try {
          await refreshData();
        } catch (refreshError) {
          console.error("Error refreshing parent data:", refreshError);
        }
      }
    } catch (error) {
      console.error("Error removing attendee from course:", error);
      toast.error("Failed to remove attendee from course. Please try again.");
    } finally {
      // Always ensure the delete dialog is closed and selected attendee is reset
      setDeleteDialogOpen(false);
      setSelectedAttendee(null);
    }
  };

  // Format rank for display
  const formatRank = (rank: string) => {
    return rank.replace(/_/g, " ");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Course Attendees</DialogTitle>
            <DialogDescription>
              Manage attendees for {courseName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attendees..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddAttendee}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Attendee
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="flex-1 border rounded-md">
              {filteredAttendees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.map((attendee) => (
                      <TableRow key={attendee.id}>
                        <TableCell className="font-medium">
                          {attendee.name} {attendee.surname}
                        </TableCell>
                        <TableCell>{attendee.email}</TableCell>
                        <TableCell>{formatRank(attendee.rank)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAttendee(attendee)}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">No attendees found</p>
                  {searchQuery && (
                    <Button 
                      variant="link" 
                      onClick={() => setSearchQuery("")}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
          
          <DialogFooter className="mt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Assign Attendee Dialog */}
      <CourseAttendeeDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        courseId={courseId}
        onSuccess={async () => {
          await fetchAttendees();
          
          // Close the dialog and refresh parent data
          if (refreshData) {
            setAssignDialogOpen(false);
            onOpenChange(false);
            await refreshData();
          }
        }}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Attendee"
        description={`Are you sure you want to remove ${selectedAttendee?.name} ${selectedAttendee?.surname} from this course? This action cannot be undone.`}
        onConfirm={confirmRemoveAttendee}
      />
    </>
  );
}

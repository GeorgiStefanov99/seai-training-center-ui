"use client"

import React, { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { CustomTable } from "@/components/ui/custom-table";
import { Column } from "@/types/table";
import { Attendee } from "@/types/attendee";
import { Document, FileItem } from "@/types/document";
import { getAttendees } from "@/services/attendeeService";
import { getAttendeeDocuments, deleteDocument } from "@/services/documentService";
import { getDocumentFiles } from "@/services/fileService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Loader2, Eye, Edit, Trash2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { DocumentPreviewDialog } from "@/components/dialogs/document-preview-dialog";
import { DocumentDialog } from "@/components/dialogs/document-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getCourseTemplates } from "@/services/courseTemplateService";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DocumentsPage() {
  const { user } = useAuth();
  const trainingCenterId = user?.userId || "";
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  
  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ attendee: Attendee; doc: Document; files: FileItem[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [courseTemplates, setCourseTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");

  useEffect(() => {
    const fetchAllDocuments = async () => {
      setIsLoading(true);
      try {
        const attendees = await getAttendees(trainingCenterId);
        const allRows: any[] = [];
        for (const attendee of attendees) {
          const documents = await getAttendeeDocuments({ trainingCenterId: attendee.trainingCenterId, attendeeId: attendee.id });
          for (const doc of documents) {
            const files = await getDocumentFiles({ trainingCenterId: attendee.trainingCenterId, attendeeId: attendee.id, documentId: doc.id });
            allRows.push({ attendee, doc, files });
          }
        }
        setRows(allRows);
        setError(null);
      } catch (err) {
        setError("Failed to load documents. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    if (trainingCenterId) fetchAllDocuments();
  }, [trainingCenterId]);

  // Fetch course templates for filter
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!trainingCenterId) return;
      try {
        const templates = await getCourseTemplates(trainingCenterId);
        setCourseTemplates(templates);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchTemplates();
  }, [trainingCenterId]);

  // Filtered rows based on selected template
  const filteredRows =
    selectedTemplate && selectedTemplate !== "all"
      ? rows.filter(row =>
          row.doc.name.toLowerCase().includes(selectedTemplate.toLowerCase())
        )
      : rows;
      
  // Calculate pagination values
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  
  // Get current page items
  const currentPageItems = filteredRows.slice(startIndex, endIndex);

  const handlePreview = (row: { attendee: Attendee; doc: Document; files: FileItem[] }) => {
    setSelectedDocument(row);
    setPreviewDialogOpen(true);
  };

  const handleEdit = (row: { attendee: Attendee; doc: Document; files: FileItem[] }) => {
    setSelectedDocument(row);
    setEditDialogOpen(true);
  };

  const handleDelete = (row: { attendee: Attendee; doc: Document; files: FileItem[] }) => {
    setSelectedDocument(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    try {
      setIsDeleting(true);
      await deleteDocument({
        trainingCenterId: selectedDocument.attendee.trainingCenterId,
        attendeeId: selectedDocument.attendee.id,
        documentId: selectedDocument.doc.id
      });
      setRows(rows.filter(row =>
        row.doc.id !== selectedDocument.doc.id ||
        row.attendee.id !== selectedDocument.attendee.id
      ));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDocumentSuccess = () => {
    if (trainingCenterId) {
      const fetchAllDocuments = async () => {
        try {
          const attendees = await getAttendees(trainingCenterId);
          const allRows: any[] = [];
          for (const attendee of attendees) {
            const documents = await getAttendeeDocuments({ trainingCenterId: attendee.trainingCenterId, attendeeId: attendee.id });
            for (const doc of documents) {
              const files = await getDocumentFiles({ trainingCenterId: attendee.trainingCenterId, attendeeId: attendee.id, documentId: doc.id });
              allRows.push({ attendee, doc, files });
            }
          }
          setRows(allRows);
        } catch (err) {
          console.error("Error refreshing documents:", err);
        }
      };
      fetchAllDocuments();
    }
  };

  // Define columns for CustomTable
  const columns: Column[] = [
    {
      key: "index",
      header: <div className="flex items-center justify-center w-full">#</div>,
      cell: (_: any, index: number) => (
        <div className="flex items-center justify-center w-full">{index + 1}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "attendee",
      header: <div className="flex items-center justify-center w-full">Attendee</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full font-medium">
          <a
            href={`/attendees/attendee-detail?id=${row.attendee.id}`}
            className="text-primary underline hover:text-primary/80 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {row.attendee.name} {row.attendee.surname}
          </a>
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "docName",
      header: <div className="flex items-center justify-center w-full">Document Name</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full font-medium">{row.doc.name}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "number",
      header: <div className="flex items-center justify-center w-full">Number</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.doc.number}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "issueDate",
      header: <div className="flex items-center justify-center w-full">Issue Date</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.doc.issueDate ? format(new Date(row.doc.issueDate), 'PPP') : '-'}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "expiryDate",
      header: <div className="flex items-center justify-center w-full">Expiry Date</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.doc.expiryDate ? format(new Date(row.doc.expiryDate), 'PPP') : '-'}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "verified",
      header: <div className="flex items-center justify-center w-full">Verified</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">
          {row.doc.isVerified ? (
            <Badge variant="success"><Check className="h-4 w-4 mr-1 inline" />Verified</Badge>
          ) : (
            <Badge variant="outline">Not Verified</Badge>
          )}
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "files",
      header: <div className="flex items-center justify-center w-full">Files</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.files.length}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "actions",
      header: <div className="flex items-center justify-center w-full">Actions</div>,
      cell: (row: any, _index: number) => (
        <div className="flex items-center justify-center gap-2 w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            title="Preview Files"
            onClick={() => handlePreview(row)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Edit Document"
            onClick={() => handleEdit(row)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Delete Document" 
            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            onClick={() => handleDelete(row)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    }
  ];

  return (
    <PageLayout title="All Attendee Documents">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
        )}
        <div className="flex flex-col space-y-4">
          <h2 className="text-xl font-semibold">All Documents</h2>
          {/* Course Template Filter */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value);
                setCurrentPage(1); // Reset to first page when filtering
              }}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by Course Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {courseTemplates.map((template: any) => (
                    <SelectItem key={template.id} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <CustomTable
          columns={columns}
          data={currentPageItems}
          isLoading={isLoading}
          rowRender={(row, index) => (
            <tr 
              key={row.doc.id || index} 
              className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
            >
              <td className="px-3 py-2 text-xs text-center">{index + 1}</td>
              <td className="px-3 py-2 text-xs text-center">
                <a
                  href={`/attendees/attendee-detail?id=${row.attendee.id}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  {row.attendee.name} {row.attendee.surname}
                </a>
              </td>
              <td className="px-3 py-2 text-xs text-center font-medium">{row.doc.name}</td>
              <td className="px-3 py-2 text-xs text-center">{row.doc.number}</td>
              <td className="px-3 py-2 text-xs text-center">{row.doc.issueDate ? format(new Date(row.doc.issueDate), 'PPP') : '-'}</td>
              <td className="px-3 py-2 text-xs text-center">{row.doc.expiryDate ? format(new Date(row.doc.expiryDate), 'PPP') : '-'}</td>
              <td className="px-3 py-2 text-xs text-center">
                {row.doc.isVerified ? (
                  <Badge variant="success"><Check className="h-4 w-4 mr-1 inline" />Verified</Badge>
                ) : (
                  <Badge variant="outline">Not Verified</Badge>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-center">{row.files.length}</td>
              <td className="px-3 py-2 text-xs text-center align-middle">
                <div className="flex items-center justify-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Preview Document" 
                    onClick={() => handlePreview(row)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Edit Document" 
                    onClick={() => handleEdit(row)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Delete Document" 
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => handleDelete(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          )}
          emptyState={
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No documents found</p>
            </div>
          }
        />
        
        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {endIndex} of {totalItems} records
            </div>
            <div className="flex items-center space-x-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Document Preview Dialog */}
      {selectedDocument && (
        <DocumentPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          trainingCenterId={selectedDocument.attendee.trainingCenterId}
          attendeeId={selectedDocument.attendee.id}
          documentId={selectedDocument.doc.id}
          documentName={selectedDocument.doc.name}
          files={selectedDocument.files}
          onFileDeleted={handleDocumentSuccess}
        />
      )}

      {/* Document Edit Dialog */}
      {selectedDocument && (
        <DocumentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          trainingCenterId={selectedDocument.attendee.trainingCenterId}
          attendeeId={selectedDocument.attendee.id}
          document={selectedDocument.doc}
          onSuccess={handleDocumentSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              and all associated files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
} 
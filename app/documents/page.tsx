"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { PageLayout } from "@/components/page-layout";
import { CustomTable } from "@/components/ui/custom-table";
import { Column } from "@/types/table";
import { Attendee } from "@/types/attendee";
import { Document, FileItem } from "@/types/document";
import { getPaginatedAttendees } from '@/services/attendeeService';
import { getAttendeeDocuments, deleteDocument } from "@/services/documentService";
import { getDocumentFiles, extractFileIdOrName } from "@/services/fileService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { Loader2, Eye, Edit, Trash2, Check, Search } from "lucide-react";
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

// Utility to normalize file metadata for UI
function normalizeFileItem(file: any, idx: number) {
  const id = extractFileIdOrName(file) || file.id || file.fileId || `file-${idx + 1}`;
  const name = file.name || file.fileName || `File ${idx + 1}`;
  const contentType =
    file.contentType ||
    (file.headers && (file.headers['Content-Type']?.[0] || file.headers['content-type']?.[0])) ||
    'application/octet-stream';
  const size =
    file.size ||
    file.contentLength ||
    (file.headers && parseInt(file.headers['Content-Length']?.[0] || file.headers['content-length']?.[0] || '0', 10)) ||
    (file.body && typeof file.body === 'string' ? file.body.length : 0) ||
    0;
  const debugInfo = { id, name, contentType, size, original: file };
  console.log('[normalizeFileItem] Normalized file:', debugInfo);
  return {
    ...file,
    id,
    name,
    contentType,
    size,
    _debugInfo: debugInfo,
  };
}

export default function DocumentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const trainingCenterId = user?.userId || "";
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchInProgress, setIsFetchInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const initialFetchDone = useRef(false);
  
  // Pagination state
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [courseTemplates, setCourseTemplates] = useState<any[]>([]);
  
  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ attendee: Attendee; doc: Document; files: FileItem[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Function to fetch all documents
  const fetchAllDocuments = useCallback(async () => {
    console.log('📋 Starting fetchAllDocuments with trainingCenterId:', trainingCenterId);
    
    // Check if we have a valid trainingCenterId
    if (!trainingCenterId) {
      console.error('Training center ID is missing or empty');
      setError("User authentication required. Please log in again.");
      return;
    }
    
    // Use a flag to track if we've already started fetching to prevent duplicate calls
    if (isFetchInProgress) {
      console.log('📋 Already fetching data, skipping duplicate fetch');
      return;
    }
    
    setIsLoading(true);
    setIsFetchInProgress(true);
    
    try {
      console.log('📋 Fetching attendees for training center:', trainingCenterId);
      let allAttendees: Attendee[] = [];
      try {
        const response = await getPaginatedAttendees(trainingCenterId, { sortBy: 'name' });
        allAttendees = response.attendees;
        console.log('📋 Received attendees:', allAttendees.length);
      } catch (attendeeErr) {
        console.error('Error fetching attendees:', attendeeErr);
        setError("Failed to load attendees. Please try again.");
        setIsLoading(false);
        setIsFetchInProgress(false);
        return;
      }
      
      // Process documents for each attendee
      const allRows: any[] = [];
      
      // Process attendees in batches to avoid too many parallel requests
      const batchSize = 5;
      for (let i = 0; i < allAttendees.length; i += batchSize) {
        const attendeeBatch = allAttendees.slice(i, i + batchSize);
        const batchPromises = attendeeBatch.map(async (attendee) => {
          try {
            // Get documents with their files for this attendee
            const documents = await getAttendeeDocuments({ 
              trainingCenterId: attendee.trainingCenterId, 
              attendeeId: attendee.id,
              includeFiles: true // This will now return documents with their files
            });
            
            // Map documents to rows with their files, normalizing each file
            return documents.map(doc => {
              const files = (doc.documentFiles || []).map((file, idx) => normalizeFileItem(file, idx));
              console.log('[fetchAllDocuments] Document:', doc.name, 'Files:', files);
              return {
                attendee,
                doc,
                files,
              };
            });
          } catch (docErr) {
            console.error(`Error fetching documents for attendee ${attendee.id}:`, docErr);
            return [];
          }
        });
        
        // Wait for this batch of attendees to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten the results and add to allRows
        batchResults.forEach(attendeeResults => {
          attendeeResults.forEach(result => {
            allRows.push(result);
          });
        });
      }
      
      console.log('📋 Processed all documents, total rows:', allRows.length);
      setRows(allRows);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError("Failed to load documents. Please try again.");
    } finally {
      setIsLoading(false);
      setIsFetchInProgress(false);
    }
  }, [trainingCenterId]);
  
  // Initial data fetch - only run once when auth is complete
  useEffect(() => {
    // Only fetch data when auth is complete and we have a valid trainingCenterId
    console.log('📋 Documents page useEffect running with:', {
      authLoading,
      trainingCenterId,
      userAuthenticated: !!user?.isAuthenticated,
      initialFetchDone: initialFetchDone.current
    });
    
    // Only fetch if authentication is complete, we have a valid ID, and we haven't already fetched
    if (!authLoading && trainingCenterId && user?.isAuthenticated && !initialFetchDone.current && !isFetchInProgress) {
      console.log('📋 Conditions met, calling fetchAllDocuments');
      initialFetchDone.current = true;
      fetchAllDocuments();
    } else {
      console.log('📋 Skipping fetchAllDocuments, conditions not met or already fetched');
    }
  }, [trainingCenterId, authLoading, user?.isAuthenticated, isFetchInProgress]);

  // Fetch course templates for filter
  useEffect(() => {
    console.log('📋 Templates useEffect running with:', {
      authLoading,
      trainingCenterId
    });
    
    const fetchTemplates = async () => {
      if (!trainingCenterId || authLoading) {
        console.log('📋 Skipping template fetch, conditions not met');
        return;
      }
      
      console.log('📋 Fetching course templates for:', trainingCenterId);
      try {
        const templates = await getCourseTemplates(trainingCenterId);
        console.log('📋 Received templates:', templates.length);
        setCourseTemplates(templates);
      } catch (err) {
        console.error('Error fetching course templates:', err);
      }
    };
    
    fetchTemplates();
  }, [trainingCenterId, authLoading, setCourseTemplates]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTemplate]);
  
  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else setSortDirection('asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Filter and sort rows based on search query, template selection, and sorting
  const filteredRows = useMemo(() => {
    let filtered = [...rows];
    // Apply search filter if search query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(row => 
        row.attendee.name?.toLowerCase().includes(query) ||
        row.attendee.surname?.toLowerCase().includes(query) ||
        row.doc.name?.toLowerCase().includes(query) ||
        row.doc.description?.toLowerCase().includes(query) ||
        row.doc.number?.toLowerCase().includes(query)
      );
    }
    // Apply course filter if not set to "all"
    if (selectedTemplate !== "all") {
      // Find the selected template name
      const selectedCourse = courseTemplates.find(template => template.id === selectedTemplate);
      if (selectedCourse?.name) {
        // Split the course name into words for more flexible matching
        const courseName = selectedCourse.name.toLowerCase();
        const courseNameParts = courseName.split(/\s+/).filter((part: string) => part.length >= 3);
        // Filter documents where the document name contains key parts of the course name
        filtered = filtered.filter(row => {
          const docName = row.doc.name?.toLowerCase() || '';
          // Count how many significant words from the course name are in the document name
          const matchingWords = courseNameParts.filter((part: string) => docName.includes(part));
          // Calculate the percentage of matching words
          const matchPercentage = matchingWords.length / courseNameParts.length;
          // Require either:
          // 1. At least 50% of the significant course name words to match, OR
          // 2. The document name contains the full course name, OR
          // 3. At least 2 matching words if the course name has 3+ significant words
          return docName.includes(courseName) || 
                 matchPercentage >= 0.5 || 
                 (courseNameParts.length >= 3 && matchingWords.length >= 2);
        });
      }
    }
    // Sort filtered rows if needed
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let aValue = a.doc[sortColumn];
        let bValue = b.doc[sortColumn];
        if (aValue && bValue) {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        if (!aValue) return 1;
        if (!bValue) return -1;
        if (sortDirection === 'asc') return aValue - bValue;
        return bValue - aValue;
      });
    }
    return filtered;
  }, [rows, searchQuery, selectedTemplate, courseTemplates, sortColumn, sortDirection]);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  
  // Get current page items
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Handle document preview
  const handlePreview = (row: { attendee: Attendee; doc: Document; files: FileItem[] }) => {
    // Simply store the document ID and open the preview dialog
    // The DocumentPreviewDialog will use the files directly
    console.log('Preview document:', row.doc.id);
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
      // Reuse the main fetchAllDocuments function
      fetchAllDocuments();
    }
  };

  // Define columns for CustomTable
  const columns: Column[] = [
    {
      key: "index",
      header: <div className="flex items-center justify-center w-full">#</div>,
      cell: (_: any, index: number) => (
        <div className="flex items-center justify-center w-full">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</div>
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
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer select-none" onClick={() => handleSort('issueDate')}>
          Issue Date
          {sortColumn === 'issueDate' ? (
            sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : sortDirection === 'desc' ? <ChevronDown className="ml-1 h-4 w-4 inline" /> : <Minus className="ml-1 h-4 w-4 inline" />
          ) : null}
        </div>
      ),
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.doc.issueDate ? format(new Date(row.doc.issueDate), 'dd/MM/yyyy') : '-'}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "expiryDate",
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer select-none" onClick={() => handleSort('expiryDate')}>
          Expiry Date
          {sortColumn === 'expiryDate' ? (
            sortDirection === 'asc' ? <ChevronUp className="ml-1 h-4 w-4 inline" /> : sortDirection === 'desc' ? <ChevronDown className="ml-1 h-4 w-4 inline" /> : <Minus className="ml-1 h-4 w-4 inline" />
          ) : null}
        </div>
      ),
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">{row.doc.expiryDate ? format(new Date(row.doc.expiryDate), 'dd/MM/yyyy') : '-'}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "verified",
      header: <div className="flex items-center justify-center w-full">Verified</div>,
      cell: (row: any) => (
        <div className="flex items-center justify-center w-full">
          {row.doc.verified || row.doc.isVerified ? (
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
          {/* Filter and Search Controls */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">All Documents</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courseTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
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
          data={paginatedRows}
          isLoading={isLoading}
          rowRender={(row, index) => (
            <tr 
              key={row.doc.id || index} 
              className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
            >
              <td className="px-3 py-2 text-xs text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
              <td className="px-3 py-2 text-xs text-center">{row.doc.issueDate ? format(new Date(row.doc.issueDate), 'dd/MM/yyyy') : '-'}</td>
              <td className="px-3 py-2 text-xs text-center">{row.doc.expiryDate ? format(new Date(row.doc.expiryDate), 'dd/MM/yyyy') : '-'}</td>
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
        {filteredRows.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {(() => {
                const start = filteredRows.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
                const end = Math.min(currentPage * ITEMS_PER_PAGE, filteredRows.length);
                return `Showing ${start} - ${end} of ${filteredRows.length} records`;
              })()}
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
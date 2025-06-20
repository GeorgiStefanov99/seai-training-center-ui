"use client"

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { PageLayout } from "@/components/page-layout";
import { CustomTable } from "@/components/ui/custom-table";
import { Column } from "@/types/table";
import { TrainingCenterDocument, FileItem } from "@/types/document";
import { getTrainingCenterDocuments, deleteTrainingCenterDocument } from "@/services/trainingCenterDocumentService";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { Loader2, Eye, Edit, Trash2, Check, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { TrainingCenterDocumentDialog } from "@/components/dialogs/training-center-document-dialog";
import { TrainingCenterDocumentPreviewDialog } from "@/components/dialogs/training-center-document-preview-dialog";
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
import { Input } from "@/components/ui/input";

export default function InternalDocumentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const trainingCenterId = user?.userId || "";
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchInProgress, setIsFetchInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TrainingCenterDocument[]>([]);
  const initialFetchDone = useRef(false);
  
  // Pagination state
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<TrainingCenterDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Function to fetch all training center documents
  const fetchDocuments = useCallback(async () => {
    if (!trainingCenterId) {
      console.error('Training center ID is missing or empty');
      setError("User authentication required. Please log in again.");
      return;
    }
    
    if (isFetchInProgress) {
      return;
    }
    
    setIsLoading(true);
    setIsFetchInProgress(true);
    
    try {
      console.log('Fetching documents with includeFiles: true for trainingCenterId:', trainingCenterId);
      const data = await getTrainingCenterDocuments({ 
        trainingCenterId,
        includeFiles: true
      });
      console.log('Fetched documents:', data);
      console.log('Documents with files:', data.map(doc => ({ 
        id: doc.id, 
        name: doc.name, 
        fileCount: doc.documentFiles?.length || 0,
        files: doc.documentFiles 
      })));
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching training center documents:', err);
      setError("Failed to load documents. Please try again.");
    } finally {
      setIsLoading(false);
      setIsFetchInProgress(false);
    }
  }, [trainingCenterId, isFetchInProgress]);
  
  // Initial data fetch
  useEffect(() => {
    if (!authLoading && trainingCenterId && user?.isAuthenticated && !initialFetchDone.current && !isFetchInProgress) {
      initialFetchDone.current = true;
      fetchDocuments();
    }
  }, [trainingCenterId, authLoading, user?.isAuthenticated, isFetchInProgress, fetchDocuments]);

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.number.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, searchQuery]);

  // Sort documents
  const sortedDocuments = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredDocuments;

    return [...filteredDocuments].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof TrainingCenterDocument];
      let bValue: any = b[sortColumn as keyof TrainingCenterDocument];

      if (sortColumn === 'issueDate' || sortColumn === 'expiryDate' || sortColumn === 'createdDate') {
        aValue = aValue ? new Date(aValue as string).getTime() : 0;
        bValue = bValue ? new Date(bValue as string).getTime() : 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue! < bValue!) return sortDirection === 'asc' ? -1 : 1;
      if (aValue! > bValue!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDocuments, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') {
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) return <Minus className="h-4 w-4 opacity-0" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4 opacity-0" />;
  };

  // Document management handlers
  const handleAddDocument = () => {
    setSelectedDocument(null);
    setCreateDialogOpen(true);
  };

  const handlePreview = (document: TrainingCenterDocument) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const handleEdit = (document: TrainingCenterDocument) => {
    setSelectedDocument(document);
    setEditDialogOpen(true);
  };

  const handleDelete = (document: TrainingCenterDocument) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDocument) return;
    try {
      setIsDeleting(true);
      await deleteTrainingCenterDocument({
        trainingCenterId,
        documentId: selectedDocument.id
      });
      setDocuments(documents.filter(doc => doc.id !== selectedDocument.id));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDocumentSuccess = async () => {
    console.log('handleDocumentSuccess called');
    if (trainingCenterId) {
      console.log('Refreshing documents...');
      try {
        await fetchDocuments();
        console.log('Documents refreshed successfully');
      } catch (error) {
        console.error('Error refreshing documents:', error);
      }
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
      key: "name",
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => handleSort('name')}>
          Document Name {getSortIcon('name')}
        </div>
      ),
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center w-full font-medium">{doc.name}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "number",
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => handleSort('number')}>
          Number {getSortIcon('number')}
        </div>
      ),
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center w-full">{doc.number}</div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "issueDate",
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => handleSort('issueDate')}>
          Issue Date {getSortIcon('issueDate')}
        </div>
      ),
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center w-full">
          {doc.issueDate ? format(new Date(doc.issueDate), 'dd/MM/yyyy') : '-'}
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "expiryDate",
      header: (
        <div className="flex items-center justify-center w-full cursor-pointer" onClick={() => handleSort('expiryDate')}>
          Expiry Date {getSortIcon('expiryDate')}
        </div>
      ),
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center w-full">
          {doc.expiryDate ? format(new Date(doc.expiryDate), 'dd/MM/yyyy') : '-'}
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "verified",
      header: <div className="flex items-center justify-center w-full">Status</div>,
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center w-full">
          {doc.isVerified ? (
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
      cell: (doc: TrainingCenterDocument) => {
        const fileCount = doc.documentFiles?.length || 0;
        return (
          <div className="flex items-center justify-center w-full">{fileCount}</div>
        );
      },
      cellClassName: "text-center align-middle px-3 py-2"
    },
    {
      key: "actions",
      header: <div className="flex items-center justify-center w-full">Actions</div>,
      cell: (doc: TrainingCenterDocument) => (
        <div className="flex items-center justify-center gap-1 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(doc);
            }}
            className="h-7 w-7 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(doc);
            }}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(doc);
            }}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
      cellClassName: "text-center align-middle px-3 py-2"
    }
  ];

  return (
    <PageLayout title="Internal Documents">
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md">{error}</div>
        )}
        <div className="flex flex-col space-y-4">
          {/* Header with Add Button and Search */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Training Center Documents</h2>
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
              <Button onClick={handleAddDocument}>
                <Plus className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>
          </div>
        </div>
        
        <CustomTable
          columns={columns}
          data={paginatedDocuments}
          isLoading={isLoading}
          rowRender={(doc, index) => (
            <tr 
              key={doc.id || index} 
              className={`h-10 cursor-pointer hover:bg-muted/50 transition-colors ${index % 2 === 1 ? 'bg-muted/30' : ''}`}
            >
              <td className="px-3 py-2 text-xs text-center">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
              <td className="px-3 py-2 text-xs text-center font-medium">{doc.name}</td>
              <td className="px-3 py-2 text-xs text-center">{doc.number}</td>
              <td className="px-3 py-2 text-xs text-center">{doc.issueDate ? format(new Date(doc.issueDate), 'dd/MM/yyyy') : '-'}</td>
              <td className="px-3 py-2 text-xs text-center">{doc.expiryDate ? format(new Date(doc.expiryDate), 'dd/MM/yyyy') : '-'}</td>
              <td className="px-3 py-2 text-xs text-center">
                {doc.isVerified ? (
                  <Badge variant="success"><Check className="h-4 w-4 mr-1 inline" />Verified</Badge>
                ) : (
                  <Badge variant="outline">Not Verified</Badge>
                )}
              </td>
              <td className="px-3 py-2 text-xs text-center">{doc.documentFiles?.length || 0}</td>
              <td className="px-3 py-2 text-xs text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(doc);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(doc);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc);
                    }}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          )}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, sortedDocuments.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, sortedDocuments.length)} of {sortedDocuments.length} documents
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <div className="px-3 py-1 font-medium text-sm text-center min-w-[80px] bg-muted rounded-md">
              Page {currentPage} of {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        
        {/* Create Document Dialog */}
        <TrainingCenterDocumentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          document={undefined}
          trainingCenterId={trainingCenterId}
          onSuccess={handleDocumentSuccess}
        />
        
        {/* Edit Document Dialog */}
        <TrainingCenterDocumentDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          document={selectedDocument || undefined}
          trainingCenterId={trainingCenterId}
          onSuccess={handleDocumentSuccess}
        />
        
        {/* Preview Document Dialog */}
        <TrainingCenterDocumentPreviewDialog
          open={previewDialogOpen}
          onOpenChange={setPreviewDialogOpen}
          trainingCenterId={trainingCenterId}
          document={selectedDocument}
          onFileDeleted={fetchDocuments}
        />
        
        {/* Delete Document Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedDocument?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageLayout>
  );
} 
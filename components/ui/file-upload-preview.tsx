import React from 'react';
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Image as ImageIcon, Trash2, Upload, Eye } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type FilePreviewItem = {
  name: string;
  type: string;
  url: string;
  isNew?: boolean;
  fileId?: string;
};

interface FileUploadPreviewProps {
  files: FilePreviewItem[];
  onAdd: (files: File[]) => void;
  onRemove: (file: FilePreviewItem) => void;
  onPreview: (file: FilePreviewItem) => void;
  allowMultiple?: boolean;
  accept?: string;
  className?: string;
  showRemoveButton?: boolean | ((file: FilePreviewItem) => boolean);
}

export function FileUploadPreview({
  files,
  onAdd,
  onRemove,
  onPreview,
  allowMultiple = true,
  accept = ".jpg,.jpeg,.png,.pdf,.doc,.docx",
  className = "",
  showRemoveButton = true
}: FileUploadPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = allowMultiple;
    input.accept = accept;
    input.onchange = (event) => {
      const files = Array.from((event.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onAdd(files);
      }
    };
    input.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-2 text-center"
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">Click to add files</div>
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {files.map((file, idx) => (
            <div key={file.fileId || file.name + idx} className="relative group flex flex-col items-center">
              <div
                className={cn(
                  "aspect-square w-full max-w-[120px] rounded-lg border bg-muted/50 overflow-hidden flex items-center justify-center cursor-pointer group relative shadow-sm"
                )}
                onClick={() => onPreview(file)}
                tabIndex={0}
                role="button"
                aria-label={`Preview ${file.name}`}
              >
                {file.type.startsWith("image/") ? (
                  <div className="relative w-full h-full">
                    {file.url.startsWith('blob:') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('bg-muted');
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text h-8 w-8 text-muted-foreground"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div>';
                          }
                        }}
                      />
                    ) : (
                      <Image
                        src={file.url}
                        alt={file.name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                           const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('bg-muted');
                             parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text h-8 w-8 text-muted-foreground"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg></div>';
                          }
                        }}
                      />
                    )}
                  </div>
                ) : file.type === "application/pdf" ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="h-8 w-8 text-red-500" />
                  </div>
                ) : file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                {/* Overlay for Preview Button */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                  <Button variant="secondary" size="sm" className="pointer-events-none">
                    <Eye className="h-4 w-4 mr-1"/> Preview
                  </Button>
                </div>
                {/* Remove button - Shows if showRemoveButton is true OR if the file is new */}
                {(typeof showRemoveButton === 'function' ? showRemoveButton(file) : showRemoveButton) && (
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 hover:bg-red-100"
                    title="Remove file"
                    onClick={e => {
                      e.stopPropagation(); // Prevent triggering preview click
                      onRemove(file);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>
              <div className="mt-1 text-xs text-center max-w-[120px] truncate" title={file.name}>{file.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
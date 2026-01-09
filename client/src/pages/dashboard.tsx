import { useState, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Upload,
  Download,
  Trash2,
  File,
  FileText,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  MoreVertical,
  Search,
  LogOut,
  User,
  HardDrive,
  Clock,
  FolderOpen,
  Plus,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

const mockFiles: FileItem[] = [
  { id: "1", name: "Project_Proposal.pdf", size: 2456000, type: "application/pdf", uploadedAt: new Date("2026-01-08T10:30:00") },
  { id: "2", name: "team_photo.jpg", size: 3200000, type: "image/jpeg", uploadedAt: new Date("2026-01-07T14:22:00") },
  { id: "3", name: "financial_report.xlsx", size: 890000, type: "application/vnd.ms-excel", uploadedAt: new Date("2026-01-06T09:15:00") },
  { id: "4", name: "presentation_v2.pptx", size: 5600000, type: "application/vnd.ms-powerpoint", uploadedAt: new Date("2026-01-05T16:45:00") },
  { id: "5", name: "backup_data.zip", size: 15000000, type: "application/zip", uploadedAt: new Date("2026-01-04T11:00:00") },
  { id: "6", name: "meeting_notes.txt", size: 12000, type: "text/plain", uploadedAt: new Date("2026-01-03T08:30:00") },
];

const getFileIcon = (type: string) => {
  if (type.includes("image")) return FileImage;
  if (type.includes("video")) return FileVideo;
  if (type.includes("audio")) return FileAudio;
  if (type.includes("zip") || type.includes("archive")) return FileArchive;
  if (type.includes("text") || type.includes("document")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteFile, setDeleteFile] = useState<FileItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const maxStorage = 1024 * 1024 * 1024; // 1 GB

  const handleUpload = (uploadedFiles: FileList | null) => {
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setIsUploadOpen(false);
          
          Array.from(uploadedFiles).forEach(file => {
            const newFile: FileItem = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date()
            };
            setFiles(prev => [newFile, ...prev]);
          });
          
          return 0;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDelete = () => {
    if (deleteFile) {
      setFiles(prev => prev.filter(f => f.id !== deleteFile.id));
      setDeleteFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-lg font-semibold">SecureVault</span>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="button-user-menu">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">John Doe</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">John Doe</div>
                    <div className="text-muted-foreground text-xs">john@company.com</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center cursor-pointer" data-testid="link-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="lg:col-span-2 border-0 shadow-md bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnptMCAxOGMtMy4zMTQgMC02LTIuNjg2LTYtNnMyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNi0yLjY4NiA2LTYgNnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-30" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Storage Used</p>
                  <h2 className="font-display text-3xl font-bold">{formatFileSize(totalSize)}</h2>
                  <p className="text-white/70 text-sm mt-1">of {formatFileSize(maxStorage)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <HardDrive className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={(totalSize / maxStorage) * 100} className="h-2 bg-white/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="card-total-files">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Files</p>
                  <h2 className="font-display text-3xl font-bold">{files.length}</h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="card-recent-activity">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Recent Activity</p>
                  <h2 className="font-display text-3xl font-bold">{formatDate(files[0]?.uploadedAt || new Date())}</h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <Button onClick={() => setIsUploadOpen(true)} className="gap-2" data-testid="button-upload">
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
        </div>

        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Name</th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm hidden sm:table-cell">Size</th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm hidden md:table-cell">Uploaded</th>
                  <th className="text-right py-4 px-6 font-medium text-muted-foreground text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredFiles.map((file, index) => {
                    const FileIcon = getFileIcon(file.type);
                    return (
                      <motion.tr
                        key={file.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                        data-testid={`row-file-${file.id}`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <FileIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate" data-testid={`text-filename-${file.id}`}>{file.name}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-muted-foreground hidden sm:table-cell" data-testid={`text-filesize-${file.id}`}>
                          {formatFileSize(file.size)}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground hidden md:table-cell" data-testid={`text-uploaded-${file.id}`}>
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              data-testid={`button-download-${file.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-more-${file.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="gap-2">
                                  <Download className="w-4 h-4" />
                                  Download
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onClick={() => setDeleteFile(file)}
                                  data-testid={`button-delete-${file.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {filteredFiles.length === 0 && (
              <div className="py-16 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No files found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Files</DialogTitle>
            <DialogDescription>
              Drag and drop files or click to browse
            </DialogDescription>
          </DialogHeader>
          
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-upload"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              data-testid="input-file"
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="font-medium mb-2">Uploading...</p>
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium mb-1">Drop files here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-4">Maximum file size: 50 MB</p>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} data-testid="button-cancel-upload">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete File
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteFile(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="button-confirm-delete">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

const getFileIcon = (type: string) => {
  if (type?.includes("image")) return FileImage;
  if (type?.includes("video")) return FileVideo;
  if (type?.includes("audio")) return FileAudio;
  if (type?.includes("zip") || type?.includes("archive")) return FileArchive;
  if (type?.includes("text") || type?.includes("document") || type?.includes("pdf")) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deleteFile, setDeleteFile] = useState<FileItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userProfile, setUserProfile] = useState<{username: string, email: string, used_storage: number} | null>(null);

  useEffect(() => {
    fetchFiles();
    fetchProfile();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await apiRequest("GET", "/api/files");
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to fetch files", error);
      // If unauthorized, redirect to login
      if ((error as Error).message.includes("401")) {
        setLocation("/login");
      }
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await apiRequest("GET", "/api/profile");
      const data = await res.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      setLocation("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setIsUploadOpen(true);
    setUploadProgress(10); // Start progress

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulation of progress since fetch doesn't support it natively easily
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) throw new Error("Upload failed");

      toast({ title: "File uploaded successfully" });
      fetchFiles();
      fetchProfile();
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadProgress(0);
        setIsUploading(false);
      }, 500);
      
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;
    
    try {
      await apiRequest("DELETE", `/api/delete/${deleteFile.id}`);
      toast({ title: "File deleted" });
      setFiles(files.filter(f => f.id !== deleteFile.id));
      setDeleteFile(null);
      fetchProfile();
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleDownload = (fileId: string) => {
    window.location.href = `/api/download/${fileId}`;
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = userProfile?.used_storage || 0;
  // 100MB limit for demo
  const storagePercentage = Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100); 

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-card hidden md:flex flex-col z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-semibold">SecureVault</span>
          </div>

          <Button 
            className="w-full justify-start gap-2 mb-6" 
            size="lg"
            onClick={() => setIsUploadOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Upload New File
          </Button>

          <nav className="space-y-1">
            <Button variant="secondary" className="w-full justify-start gap-3">
              <FolderOpen className="w-4 h-4" />
              My Files
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Clock className="w-4 h-4" />
              Recent
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <User className="w-4 h-4" />
              Shared
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3">
              <Trash2 className="w-4 h-4" />
              Trash
            </Button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t bg-muted/20">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Storage</span>
              <span className="text-muted-foreground">{Math.round(storagePercentage)}%</span>
            </div>
            <Progress value={storagePercentage} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2">
              {formatFileSize(totalSize)} used of 100 MB
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-4 border-t">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium truncate">{userProfile?.username || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">{userProfile?.email}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold">My Files</h1>
            <p className="text-muted-foreground">Manage your secure documents</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search files..." 
                className="pl-9 bg-background" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:hidden">
              <Button size="icon" variant="outline" onClick={() => setIsUploadOpen(true)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {filteredFiles.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/10">
             <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
               <File className="w-8 h-8 text-muted-foreground" />
             </div>
             <h3 className="text-lg font-medium mb-1">No files found</h3>
             <p className="text-muted-foreground max-w-sm mb-6">
               Upload your first file to get started with SecureVault
             </p>
             <Button onClick={() => setIsUploadOpen(true)}>
               <Upload className="w-4 h-4 mr-2" />
               Upload File
             </Button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <Card key={file.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteFile(file)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h3 className="font-medium truncate mb-1" title={file.name}>{file.name}</h3>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Drag and drop your file here or click to browse
            </DialogDescription>
          </DialogHeader>
          
          <div 
            className={`
              mt-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors
              ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            `}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) uploadFile(e.dataTransfer.files[0]);
            }}
          >
            {isUploading ? (
              <div className="space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">Uploading...</div>
                  <Progress value={uploadProgress} className="h-2 w-full" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Select File
                  </Button>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Max file size: 100MB
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteFile} onOpenChange={(open) => !open && setDeleteFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFile(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

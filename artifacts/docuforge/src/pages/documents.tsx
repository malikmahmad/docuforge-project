import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  FileText, FileCode, BookOpen, ListTodo, RefreshCw,
  GitCommit, Users, CheckSquare, FileBox, Settings,
  Plus, Search, Copy, Trash2, ExternalLink, Filter
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useListDocuments,
  useDeleteDocument,
  useDuplicateDocument,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const TYPE_ICONS: Record<string, React.ElementType> = {
  "api-reference": FileCode,
  "technical-spec": Settings,
  "user-manual": BookOpen,
  "product-requirements": ListTodo,
  "changelog": RefreshCw,
  "readme": FileText,
  "release-notes": GitCommit,
  "meeting-notes": Users,
  "sop": CheckSquare,
  "custom": FileBox,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  review: "bg-blue-100 text-blue-800 border-blue-200",
  published: "bg-green-100 text-green-800 border-green-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
};

export function Documents() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents, isLoading } = useListDocuments(
    { type: typeFilter !== "all" ? typeFilter : undefined, search: search || undefined },
    { query: { queryKey: getListDocumentsQueryKey({ type: typeFilter !== "all" ? typeFilter : undefined, search: search || undefined }) } }
  );

  const deleteMutation = useDeleteDocument({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document deleted" });
        setDeleteId(null);
      },
    },
  });

  const duplicateMutation = useDuplicateDocument({
    mutation: {
      onSuccess: (doc) => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        toast({ title: "Document duplicated", description: `Created "${doc.title}"` });
      },
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Loading..." : `${documents?.length ?? 0} document${documents?.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/documents/new">
            <Plus className="w-4 h-4" />
            New Document
          </Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="api-reference">API Reference</SelectItem>
            <SelectItem value="technical-spec">Technical Spec</SelectItem>
            <SelectItem value="user-manual">User Manual</SelectItem>
            <SelectItem value="product-requirements">Product Requirements</SelectItem>
            <SelectItem value="changelog">Changelog</SelectItem>
            <SelectItem value="readme">README</SelectItem>
            <SelectItem value="release-notes">Release Notes</SelectItem>
            <SelectItem value="meeting-notes">Meeting Notes</SelectItem>
            <SelectItem value="sop">SOP</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : documents?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No documents found</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            {search || typeFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first document to get started."}
          </p>
          {!search && typeFilter === "all" && (
            <Button asChild>
              <Link href="/documents/new">
                <Plus className="w-4 h-4 mr-2" />
                Create Document
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {documents?.map((doc) => {
            const Icon = TYPE_ICONS[doc.type] || FileBox;
            const statusClass = STATUS_COLORS[doc.status] ?? "bg-gray-100 text-gray-600 border-gray-200";
            return (
              <Card key={doc.id} className="group hover:shadow-sm transition-all duration-150">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/documents/${doc.id}`}>
                          <span className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                            {doc.title}
                          </span>
                        </Link>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>
                          {doc.status}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {doc.type.replace(/-/g, " ")}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>v{doc.version}</span>
                        <span>&bull;</span>
                        <span>{doc.wordCount.toLocaleString()} words</span>
                        <span>&bull;</span>
                        <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                        {doc.tags && (
                          <>
                            <span>&bull;</span>
                            <span className="truncate max-w-32">{doc.tags}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/documents/${doc.id}`)}
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => duplicateMutation.mutate({ id: doc.id })}
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(doc.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

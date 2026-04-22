import { Link } from "wouter";
import { 
  FileText, 
  FileCode, 
  Settings, 
  BookOpen, 
  ListTodo, 
  RefreshCw,
  GitCommit,
  Users,
  CheckSquare,
  FileBox,
  Plus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDocumentStats, useGetRecentDocuments } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TYPE_ICONS: Record<string, any> = {
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

export function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useGetDocumentStats();
  const { data: recentDocs, isLoading: isLoadingRecent } = useGetRecentDocuments();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your documentation forge.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/documents/new">
            <Plus className="w-4 h-4" />
            New Document
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Words</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{(stats?.totalWords || 0).toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.recentCount || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.byStatus?.published || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recently modified documents.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentDocs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent documents found.
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocs?.map(doc => {
                  const Icon = TYPE_ICONS[doc.type] || FileText;
                  return (
                    <Link key={doc.id} href={`/documents/${doc.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{new Date(doc.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{doc.status}</Badge>
                          <Badge variant="outline">{doc.wordCount} words</Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Create</CardTitle>
            <CardDescription>Start a new document from a common type.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {["api-reference", "technical-spec", "user-manual", "product-requirements"].map(type => {
                const Icon = TYPE_ICONS[type] || FileText;
                return (
                  <Button key={type} variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center justify-center text-center" asChild>
                    <Link href={`/documents/new?type=${type}`}>
                      <Icon className="w-6 h-6 text-primary" />
                      <span className="text-xs font-medium capitalize">{type.replace("-", " ")}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

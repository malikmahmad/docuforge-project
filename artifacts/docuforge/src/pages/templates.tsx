import { useLocation } from "wouter";
import {
  FileCode, BookOpen, ListTodo, RefreshCw,
  GitCommit, Users, CheckSquare, FileText, Settings, FileBox
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListTemplates, useCreateDocument, getListDocumentsQueryKey } from "@workspace/api-client-react";
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

const TYPE_COLORS: Record<string, string> = {
  "api-reference": "bg-purple-100 text-purple-700",
  "technical-spec": "bg-blue-100 text-blue-700",
  "user-manual": "bg-green-100 text-green-700",
  "product-requirements": "bg-orange-100 text-orange-700",
  "changelog": "bg-teal-100 text-teal-700",
  "readme": "bg-indigo-100 text-indigo-700",
  "release-notes": "bg-cyan-100 text-cyan-700",
  "meeting-notes": "bg-yellow-100 text-yellow-700",
  "sop": "bg-red-100 text-red-700",
  "custom": "bg-gray-100 text-gray-700",
};

export function Templates() {
  const { data: templates, isLoading } = useListTemplates();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (doc) => {
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        navigate(`/documents/${doc.id}`);
      },
      onError: () => {
        toast({ title: "Failed to create document", variant: "destructive" });
      },
    },
  });

  function handleUseTemplate(template: { name: string; type: string; content: string; description: string }) {
    createMutation.mutate({
      data: {
        title: `New ${template.name}`,
        type: template.type,
        content: template.content,
        description: template.description,
        status: "draft",
      },
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground mt-1">
          Choose a template to start your document with professional structure and formatting.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template) => {
            const Icon = TYPE_ICONS[template.type] || FileBox;
            const colorClass = TYPE_COLORS[template.type] || "bg-gray-100 text-gray-700";
            return (
              <Card
                key={template.id}
                className="group hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-primary/50"
                onClick={() => handleUseTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${colorClass} mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {template.type.replace(/-/g, " ")}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    className="w-full"
                    size="sm"
                    variant="outline"
                    disabled={createMutation.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                  >
                    {createMutation.isPending ? "Creating..." : "Use Template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

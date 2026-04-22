import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import {
  Save, Download, FileText, ChevronLeft, Bold, Italic, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Table, Minus,
  CheckSquare, Quote, Link2, Eye, Edit3, Loader2, Sparkles, X,
  ChevronDown, ChevronUp, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useGetDocument,
  useCreateDocument,
  useUpdateDocument,
  useExportDocument,
  getListDocumentsQueryKey,
  getGetDocumentQueryKey,
  getGetRecentDocumentsQueryKey,
  getGetDocumentStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function useQuery() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

const TOOLBAR_ACTIONS = [
  { icon: Heading1, label: "Heading 1", insert: "# ", wrap: false },
  { icon: Heading2, label: "Heading 2", insert: "## ", wrap: false },
  { icon: Heading3, label: "Heading 3", insert: "### ", wrap: false },
  null,
  { icon: Bold, label: "Bold", insert: "**", wrap: true },
  { icon: Italic, label: "Italic", insert: "*", wrap: true },
  { icon: Code, label: "Inline Code", insert: "`", wrap: true },
  null,
  { icon: List, label: "Bullet List", insert: "- ", wrap: false },
  { icon: ListOrdered, label: "Ordered List", insert: "1. ", wrap: false },
  { icon: CheckSquare, label: "Task", insert: "- [ ] ", wrap: false },
  { icon: Quote, label: "Quote", insert: "> ", wrap: false },
  null,
  { icon: Table, label: "Table", insert: "| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |", wrap: false },
  { icon: Minus, label: "Divider", insert: "\n---\n", wrap: false },
  { icon: Link2, label: "Link", insert: "[link text](https://url)", wrap: false },
  null,
  {
    icon: Code,
    label: "Code Block",
    insert: "```\n\n```",
    wrap: false,
    customInsert: (textarea: HTMLTextAreaElement, content: string): string => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = content.substring(start, end);
      const before = content.substring(0, start);
      const after = content.substring(end);
      return before + "```\n" + selected + "\n```" + after;
    },
  },
];

const DOC_TYPES = [
  { value: "api-reference", label: "API Reference" },
  { value: "technical-spec", label: "Technical Spec" },
  { value: "user-manual", label: "User Manual" },
  { value: "product-requirements", label: "Product Requirements" },
  { value: "changelog", label: "Changelog" },
  { value: "readme", label: "README" },
  { value: "release-notes", label: "Release Notes" },
  { value: "meeting-notes", label: "Meeting Notes" },
  { value: "sop", label: "SOP" },
  { value: "custom", label: "Custom" },
];

const SCALE_OPTIONS = [
  { value: "small", label: "Small (simple / brief)" },
  { value: "medium", label: "Medium (standard depth)" },
  { value: "large", label: "Large (comprehensive)" },
  { value: "enterprise", label: "Enterprise (exhaustive)" },
];

type GenerateForm = {
  description: string;
  scale: string;
  customHeadings: string;
  advancedRequirements: string;
  apiDetails: string;
};

function AIGeneratePanel({
  title,
  docType,
  onGenerated,
  onClose,
}: {
  title: string;
  docType: string;
  onGenerated: (content: string) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<GenerateForm>({
    description: "",
    scale: "medium",
    customHeadings: "",
    advancedRequirements: "",
    apiDetails: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!form.description.trim()) {
      toast({ title: "Please describe what you want to document", variant: "destructive" });
      return;
    }
    if (!title.trim() || title === "Untitled Document") {
      toast({ title: "Please set a document title first", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setProgress("");
    abortRef.current = new AbortController();

    try {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          docType,
          description: form.description,
          scale: form.scale,
          customHeadings: form.customHeadings || undefined,
          advancedRequirements: form.advancedRequirements || undefined,
          apiDetails: form.apiDetails || undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.content) {
                accumulated += data.content;
                setProgress(accumulated);
              }
              if (data.done) {
                onGenerated(accumulated);
                onClose();
                toast({ title: "Documentation generated successfully" });
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast({ title: "Generation failed. Please try again.", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsGenerating(false);
    setProgress("");
  };

  return (
    <div className="border-b bg-card">
      <div className="px-6 py-4 space-y-4 max-w-4xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Generate with AI</span>
            <Badge variant="secondary" className="text-xs">Beta</Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {isGenerating ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
              <span>Generating your {DOC_TYPES.find(d => d.value === docType)?.label ?? "documentation"}...</span>
            </div>
            {progress && (
              <div className="relative bg-muted/40 rounded-lg border p-3 max-h-32 overflow-hidden">
                <div className="text-xs font-mono text-muted-foreground leading-relaxed line-clamp-5">
                  {progress.slice(0, 400)}{progress.length > 400 ? "..." : ""}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted/40 to-transparent rounded-b-lg" />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5 text-xs">
              <X className="w-3.5 h-3.5" />
              Cancel Generation
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  What should this document cover? <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className="text-xs resize-none min-h-20"
                  placeholder={
                    docType === "api-reference"
                      ? "e.g. REST API for a task management app with authentication, task CRUD, labels, and team sharing endpoints..."
                      : docType === "user-manual"
                      ? "e.g. User manual for a desktop photo editing application covering import, layers, filters, and export..."
                      : docType === "meeting-notes"
                      ? "e.g. Q2 product roadmap review meeting with engineering and design teams, discussed feature prioritization..."
                      : "Describe what this document should cover, the project context, audience, and any key information..."
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Project Scale</Label>
                  <Select value={form.scale} onValueChange={(v) => setForm(f => ({ ...f, scale: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALE_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Custom Sections (optional)</Label>
                  <Input
                    value={form.customHeadings}
                    onChange={(e) => setForm(f => ({ ...f, customHeadings: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="e.g. Webhooks, SDK Examples, Migration Guide"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Additional Requirements</Label>
                  <Textarea
                    value={form.advancedRequirements}
                    onChange={(e) => setForm(f => ({ ...f, advancedRequirements: e.target.value }))}
                    className="text-xs resize-none min-h-16"
                    placeholder="e.g. Must include TypeScript examples, follow RFC 2119 language (MUST/SHOULD/MAY), target audience: senior developers..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">API / Technical Details</Label>
                  <Textarea
                    value={form.apiDetails}
                    onChange={(e) => setForm(f => ({ ...f, apiDetails: e.target.value }))}
                    className="text-xs resize-none min-h-16"
                    placeholder="e.g. Base URL: https://api.example.com/v2, Auth: Bearer JWT, key endpoints: POST /tasks, GET /tasks/{id}..."
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleGenerate} className="gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" />
                Generate Documentation
              </Button>
              <p className="text-xs text-muted-foreground">
                AI will generate a complete, well-structured document based on your inputs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Editor() {
  const [matchNew] = useRoute("/documents/new");
  const [matchId, params] = useRoute("/documents/:id");
  const [, navigate] = useLocation();
  const query = useQuery();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const docId = matchId && params?.id && params.id !== "new" ? parseInt(params.id, 10) : null;

  const { data: existingDoc, isLoading: isLoadingDoc } = useGetDocument(
    docId!,
    { query: { enabled: docId !== null, queryKey: getGetDocumentQueryKey(docId!) } }
  );

  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState(query.get("type") ?? "custom");
  const [status, setStatus] = useState("draft");
  const [version, setVersion] = useState("1.0");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(docId);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    if (existingDoc) {
      setTitle(existingDoc.title);
      setContent(existingDoc.content);
      setDocType(existingDoc.type);
      setStatus(existingDoc.status);
      setVersion(existingDoc.version);
      setDescription(existingDoc.description ?? "");
      setTags(existingDoc.tags ?? "");
      setSaveStatus("saved");
      setIsSaved(true);
    }
  }, [existingDoc]);

  const createMutation = useCreateDocument({
    mutation: {
      onSuccess: (doc) => {
        setSavedId(doc.id);
        setIsSaved(true);
        setSaveStatus("saved");
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDocumentStatsQueryKey() });
        navigate(`/documents/${doc.id}`, { replace: true });
      },
      onError: () => {
        setSaveStatus("unsaved");
        toast({ title: "Failed to save document", variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdateDocument({
    mutation: {
      onSuccess: () => {
        setSaveStatus("saved");
        queryClient.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecentDocumentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDocumentStatsQueryKey() });
        if (savedId) queryClient.invalidateQueries({ queryKey: getGetDocumentQueryKey(savedId) });
      },
      onError: () => {
        setSaveStatus("unsaved");
        toast({ title: "Failed to save document", variant: "destructive" });
      },
    },
  });

  const exportMutation = useExportDocument({
    mutation: {
      onSuccess: (result) => {
        const byteChars = atob(result.content);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: result.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast({ title: `Downloaded as ${result.filename}` });
        setIsExportingPdf(false);
        setIsExportingDoc(false);
      },
      onError: () => {
        toast({ title: "Export failed", variant: "destructive" });
        setIsExportingPdf(false);
        setIsExportingDoc(false);
      },
    },
  });

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast({ title: "Please enter a document title" });
      return;
    }
    setSaveStatus("saving");
    const data = {
      title: title.trim(),
      type: docType,
      content,
      description: description || undefined,
      status,
      version,
      tags: tags || undefined,
    };
    if (savedId) {
      updateMutation.mutate({ id: savedId, data });
    } else {
      createMutation.mutate({ data });
    }
  }, [title, docType, content, description, status, version, tags, savedId, updateMutation, createMutation, toast]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setSaveStatus("unsaved");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (isSaved || savedId) handleSave();
    }, 2500);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSaveStatus("unsaved");
  };

  const handleExport = (format: "pdf" | "doc") => {
    if (!savedId) {
      toast({ title: "Please save the document first before exporting." });
      return;
    }
    if (format === "pdf") setIsExportingPdf(true);
    else setIsExportingDoc(true);
    exportMutation.mutate({ id: savedId, data: { format } });
  };

  const handleAIGenerated = (generated: string) => {
    setContent(generated);
    setSaveStatus("unsaved");
  };

  const insertAtCursor = (action: typeof TOOLBAR_ACTIONS[0]) => {
    if (!action) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    let newContent: string;
    let newCursor: number;

    if (action.wrap) {
      newContent = before + action.insert + selected + action.insert + after;
      newCursor = start + action.insert.length + selected.length + action.insert.length;
    } else if ((action as any).customInsert) {
      newContent = (action as any).customInsert(textarea, content);
      newCursor = start + action.insert.length;
    } else {
      const lineStart = before.lastIndexOf("\n") + 1;
      const linePrefix = before.substring(lineStart);
      const isAtStart = linePrefix.trim() === "";
      const prefix = isAtStart ? "" : "\n";
      newContent = before + prefix + action.insert + selected + after;
      newCursor = before.length + prefix.length + action.insert.length + selected.length;
    }

    setContent(newContent);
    setSaveStatus("unsaved");
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const renderPreview = (text: string) => {
    let html = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/^#{6}\s+(.+)$/gm, "<h6 class='text-sm font-semibold mt-4 mb-1 text-muted-foreground uppercase tracking-wide'>$1</h6>")
      .replace(/^#{5}\s+(.+)$/gm, "<h5 class='text-sm font-bold mt-4 mb-1'>$1</h5>")
      .replace(/^#{4}\s+(.+)$/gm, "<h4 class='text-base font-bold mt-5 mb-2'>$1</h4>")
      .replace(/^#{3}\s+(.+)$/gm, "<h3 class='text-lg font-bold mt-6 mb-2'>$1</h3>")
      .replace(/^#{2}\s+(.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-3 pb-2 border-b'>$1</h2>")
      .replace(/^#{1}\s+(.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4 pb-2 border-b-2'>$1</h1>")
      .replace(/```([\w]*)\n([\s\S]*?)```/gm, "<pre class='bg-muted rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono'><code>$2</code></pre>")
      .replace(/`([^`]+)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold'>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-primary pl-4 py-1 my-3 text-muted-foreground italic'>$1</blockquote>")
      .replace(/^---$/gm, "<hr class='my-6 border-border'/>")
      .replace(/^- \[x\] (.+)$/gm, "<div class='flex items-center gap-2 my-1'><input type='checkbox' checked disabled class='accent-primary'><span class='line-through text-muted-foreground'>$1</span></div>")
      .replace(/^- \[ \] (.+)$/gm, "<div class='flex items-center gap-2 my-1'><input type='checkbox' disabled><span>$1</span></div>")
      .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc my-1'>$1</li>")
      .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal my-1'>$2</li>")
      .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, "<a href='$2' class='text-primary underline' target='_blank'>$1</a>")
      .replace(/\n\n/g, "</p><p class='my-3'>")
      .replace(/\n/g, "<br/>");
    return `<div class='prose max-w-none'><p class='my-3'>${html}</p></div>`;
  };

  if (isLoadingDoc && docId) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b px-6 py-3 flex items-center gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
        <div className="flex-1 flex gap-0">
          <div className="flex-1 p-8"><Skeleton className="h-full w-full" /></div>
          <div className="w-64 border-l p-4 space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/documents")}>
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-0 shadow-none text-lg font-semibold px-0 h-8 focus-visible:ring-0 bg-transparent"
            placeholder="Document title..."
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs font-medium ${
            saveStatus === "saved" ? "text-green-600" :
            saveStatus === "saving" ? "text-amber-600" :
            "text-muted-foreground"
          }`}>
            {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved changes"}
          </span>

          <Button
            variant={showAIPanel ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className="gap-1.5 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className="gap-1.5 text-xs"
          >
            {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {isPreview ? "Edit" : "Preview"}
          </Button>

          <Button size="sm" variant="outline" onClick={handleSave} className="gap-1.5 text-xs"
            disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={isExportingPdf || !savedId}
            className="gap-1.5 text-xs"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            PDF
          </Button>

          <Button
            size="sm"
            onClick={() => handleExport("doc")}
            disabled={isExportingDoc || !savedId}
            className="gap-1.5 text-xs"
          >
            {isExportingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            DOC
          </Button>
        </div>
      </div>

      {/* AI Generate Panel */}
      {showAIPanel && (
        <AIGeneratePanel
          title={title}
          docType={docType}
          onGenerated={handleAIGenerated}
          onClose={() => setShowAIPanel(false)}
        />
      )}

      {/* Toolbar */}
      {!isPreview && (
        <div className="flex-shrink-0 border-b bg-muted/30 px-4 py-1.5 flex items-center gap-0.5 flex-wrap">
          {TOOLBAR_ACTIONS.map((action, i) => {
            if (action === null) {
              return <Separator key={`sep-${i}`} orientation="vertical" className="h-5 mx-1" />;
            }
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={action.label}
                onClick={() => insertAtCursor(action as any)}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{wordCount.toLocaleString()} words</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor / Preview */}
        <div className="flex-1 overflow-hidden">
          {isPreview ? (
            <div
              className="h-full overflow-y-auto px-12 py-8 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
            />
          ) : (
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-full w-full resize-none border-0 rounded-none shadow-none font-mono text-sm leading-relaxed focus-visible:ring-0 p-8 bg-background"
              placeholder={`Start writing your documentation, or click "AI Generate" above to have AI write it for you.

Use markdown formatting:
# Heading 1
## Heading 2
**Bold**, *Italic*, \`code\`
- List items
\`\`\`
Code blocks
\`\`\``}
              spellCheck={true}
            />
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="w-64 flex-shrink-0 border-l overflow-y-auto bg-muted/20">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Document Info</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-8 text-xs"
                placeholder="1.0"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-none min-h-16"
                placeholder="Brief description..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-8 text-xs"
                placeholder="api, docs, v2..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Statistics</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-background rounded-md p-2 text-center border">
                  <div className="text-lg font-bold">{wordCount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
                <div className="bg-background rounded-md p-2 text-center border">
                  <div className="text-lg font-bold">{content.length.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Chars</div>
                </div>
              </div>
              <div className="bg-background rounded-md p-2 text-center border">
                <div className="text-lg font-bold">{Math.max(1, Math.ceil(wordCount / 200))}</div>
                <div className="text-xs text-muted-foreground">Min read</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Export</div>
              <p className="text-xs text-muted-foreground">Save the document first to enable exports.</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => handleExport("pdf")}
                disabled={isExportingPdf || !savedId}
              >
                {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download as PDF
              </Button>
              <Button
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={() => handleExport("doc")}
                disabled={isExportingDoc || !savedId}
              >
                {isExportingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download as DOC
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p>PDF exports as beautifully formatted HTML that prints perfectly.</p>
              <p>DOC exports as Word-compatible XML document.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

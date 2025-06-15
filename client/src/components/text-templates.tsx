import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Copy, Edit, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TextTemplate, InsertTextTemplate } from "@shared/schema";

interface TextTemplatesProps {
  onSelectTemplate?: (content: string) => void;
}

export default function TextTemplates({ onSelectTemplate }: TextTemplatesProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TextTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTextTemplate) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo template mới",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Thành công",
        description: "Đã xóa template",
      });
    },
  });

  const categories = [
    { value: "all", label: "Tất cả" },
    { value: "advertisement", label: "Quảng cáo" },
    { value: "podcast", label: "Podcast" },
    { value: "education", label: "Giảng dạy" },
    { value: "news", label: "Tin tức" },
    { value: "other", label: "Khác" },
  ];

  const filteredTemplates = templates.filter((template: TextTemplate) => 
    selectedCategory === "all" || template.category === selectedCategory
  );

  const handleCreateTemplate = (data: InsertTextTemplate) => {
    createMutation.mutate(data);
  };

  const handleUseTemplate = (template: TextTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template.content);
      toast({
        title: "Đã áp dụng template",
        description: `Sử dụng template "${template.name}"`,
      });
    }
  };

  const defaultTemplates = [
    {
      name: "Giới thiệu sản phẩm",
      category: "advertisement",
      content: "Chào mừng quý khách đến với [Tên sản phẩm]! Sản phẩm chất lượng cao với giá cả hợp lý. Đặt hàng ngay hôm nay để nhận ưu đãi đặc biệt!"
    },
    {
      name: "Mở đầu podcast",
      category: "podcast", 
      content: "Xin chào các bạn và chào mừng đến với tập mới của podcast [Tên podcast]. Tôi là [Tên host] và hôm nay chúng ta sẽ cùng thảo luận về [Chủ đề]."
    },
    {
      name: "Bài giảng mở đầu",
      category: "education",
      content: "Chào các em học sinh! Hôm nay chúng ta sẽ học về [Chủ đề]. Đây là một kiến thức rất quan trọng và các em cần chú ý lắng nghe nhé."
    }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Templates văn bản
        </CardTitle>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo template mới</DialogTitle>
            </DialogHeader>
            <TemplateForm onSubmit={handleCreateTemplate} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid gap-3">
          {/* Default templates */}
          {selectedCategory === "all" || defaultTemplates.some(t => t.category === selectedCategory) ? (
            <>
              <h4 className="text-sm font-medium text-muted-foreground">Templates mặc định</h4>
              {defaultTemplates
                .filter(template => selectedCategory === "all" || template.category === selectedCategory)
                .map((template, index) => (
                <Card key={`default-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.content}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {categories.find(c => c.value === template.category)?.label}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleUseTemplate(template as any)}
                        size="sm"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Sử dụng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : null}

          {/* User templates */}
          {filteredTemplates.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-muted-foreground">Templates của bạn</h4>
              {filteredTemplates.map((template: TextTemplate) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            {categories.find(c => c.value === template.category)?.label}
                          </Badge>
                          {template.isPublic && (
                            <Badge variant="outline">Công khai</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Sử dụng
                        </Button>
                        <Button
                          onClick={() => deleteMutation.mutate(template.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}

          {filteredTemplates.length === 0 && selectedCategory !== "all" && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có template nào trong danh mục này</p>
              <p className="text-sm">Tạo template đầu tiên của bạn!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TemplateFormProps {
  onSubmit: (data: InsertTextTemplate) => void;
  initialData?: Partial<TextTemplate>;
}

function TemplateForm({ onSubmit, initialData }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    content: initialData?.content || "",
    category: initialData?.category || "other",
    isPublic: initialData?.isPublic || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;
    
    onSubmit(formData);
  };

  const categories = [
    { value: "advertisement", label: "Quảng cáo" },
    { value: "podcast", label: "Podcast" },
    { value: "education", label: "Giảng dạy" },
    { value: "news", label: "Tin tức" },
    { value: "other", label: "Khác" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Tên template</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nhập tên template..."
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Danh mục</label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Nội dung</label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Nhập nội dung template..."
          rows={6}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit">
          Lưu template
        </Button>
      </div>
    </form>
  );
}
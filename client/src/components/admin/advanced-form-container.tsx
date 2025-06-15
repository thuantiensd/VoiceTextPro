import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  History, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Breadcrumb from '@/components/breadcrumb';

interface AdvancedFormContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: (data: any) => Promise<void>;
  onReset: () => void;
  onExport?: () => void;
  onImport?: (file: File) => void;
  hasChanges: boolean;
  isSubmitting: boolean;
  showBackButton?: boolean;
  backUrl?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  className?: string;
  validationErrors?: string[];
  successMessage?: string;
  lastSaved?: Date;
}

export function AdvancedFormContainer({
  title,
  description,
  children,
  onSave,
  onReset,
  onExport,
  onImport,
  hasChanges,
  isSubmitting,
  showBackButton = true,
  backUrl = '/admin',
  autoSave = false,
  autoSaveDelay = 3000,
  className = '',
  validationErrors = [],
  successMessage = 'Cài đặt đã được lưu thành công',
  lastSaved
}: AdvancedFormContainerProps) {
  const { toast } = useToast();
  const [autoSaveTimer, setAutoSaveTimer] = React.useState<NodeJS.Timeout | null>(null);
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-save functionality
  React.useEffect(() => {
    if (autoSave && hasChanges && !isSubmitting) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      
      const timer = setTimeout(async () => {
        try {
          setShowAutoSaveIndicator(true);
          await onSave({});
          toast({
            title: "Auto-saved",
            description: "Thay đổi đã được tự động lưu",
            duration: 2000,
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setShowAutoSaveIndicator(false);
        }
      }, autoSaveDelay);
      
      setAutoSaveTimer(timer);
    }

    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [hasChanges, autoSave, autoSaveDelay, onSave, isSubmitting, toast]);

  const handleExport = () => {
    if (onExport) {
      onExport();
      toast({
        title: "Xuất thành công",
        description: "Cài đặt đã được xuất ra file",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      toast({
        title: "Nhập thành công",
        description: "Cài đặt đã được nhập từ file",
      });
    }
  };

  const getStatusBadge = () => {
    if (isSubmitting) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Clock className="h-3 w-3 mr-1" />
          Đang lưu...
        </Badge>
      );
    }
    if (showAutoSaveIndicator) {
      return (
        <Badge variant="default" className="bg-blue-500">
          <Sparkles className="h-3 w-3 mr-1" />
          Auto-save
        </Badge>
      );
    }
    if (hasChanges) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Có thay đổi
        </Badge>
      );
    }
    if (lastSaved) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Đã lưu
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Breadcrumb 
            title={title}
            showBackButton={showBackButton}
            backUrl={backUrl}
          />
          
          <div className="mt-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {lastSaved && (
                <div className="text-sm text-slate-500">
                  Lưu lần cuối: {lastSaved.toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {children}
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 sticky bottom-6 z-10"
        >
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 p-4">
            <div className="flex items-center justify-between">
              
              {/* Left side - Import/Export */}
              <div className="flex items-center gap-3">
                {onExport && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Xuất cài đặt
                  </Button>
                )}
                
                {onImport && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImportClick}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Nhập cài đặt
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Lịch sử
                </Button>
              </div>

              {/* Center - Validation Errors */}
              <AnimatePresence>
                {validationErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {validationErrors.length} lỗi validation
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Right side - Save/Reset */}
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onReset}
                    className="flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Hủy thay đổi
                  </Button>
                )}
                
                <Button
                  onClick={() => onSave({})}
                  disabled={isSubmitting || (!hasChanges && !autoSave) || validationErrors.length > 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
                </Button>
              </div>
            </div>

            {/* Auto-save indicator */}
            {autoSave && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Sparkles className="h-3 w-3" />
                  Auto-save được kích hoạt (sau {autoSaveDelay / 1000}s)
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 
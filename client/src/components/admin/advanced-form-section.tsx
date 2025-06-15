import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';

interface AdvancedFormSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: string;
  };
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  helpText?: string;
  gradient?: boolean;
}

export function AdvancedFormSection({
  title,
  description,
  icon: Icon,
  badge,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
  helpText,
  gradient = false
}: AdvancedFormSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  const cardClasses = `
    ${gradient ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900' : 'bg-white dark:bg-slate-800'}
    border-0 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50
    hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60
    transition-all duration-300 ease-in-out
    ${className}
  `;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className={cardClasses}>
        <CardHeader 
          className={`${collapsible ? 'cursor-pointer select-none' : ''} pb-4`}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                  </CardTitle>
                  {badge && (
                    <Badge 
                      variant={badge.variant || 'default'}
                      className={badge.color ? `bg-${badge.color}-500 text-white` : ''}
                    >
                      {badge.text}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {collapsible && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="h-5 w-5 text-slate-500" />
              </motion.div>
            )}
          </div>
          
          {helpText && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {helpText}
                </p>
              </div>
            </div>
          )}
        </CardHeader>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 0,
            opacity: isExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <CardContent className="pt-0">
            {children}
          </CardContent>
        </motion.div>
      </Card>
    </motion.div>
  );
} 
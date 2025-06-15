import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Eye, EyeOff } from 'lucide-react';

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

interface AdvancedFormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'switch';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: ValidationRule[];
  options?: { value: string; label: string; disabled?: boolean }[];
  prefix?: string;
  suffix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  autoComplete?: string;
  preview?: boolean;
  className?: string;
}

export function AdvancedFormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  description,
  required = false,
  disabled = false,
  validation = [],
  options = [],
  prefix,
  suffix,
  icon: Icon,
  rows = 3,
  min,
  max,
  step,
  autoComplete,
  preview = false,
  className = ''
}: AdvancedFormFieldProps) {
  const [isValid, setIsValid] = React.useState(true);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isFocused, setIsFocused] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const validateField = React.useCallback((val: any) => {
    const newErrors: string[] = [];
    
    validation.forEach(rule => {
      switch (rule.type) {
        case 'required':
          if (!val || (typeof val === 'string' && val.trim() === '')) {
            newErrors.push(rule.message);
          }
          break;
        case 'min':
          if (type === 'number' && val < rule.value) {
            newErrors.push(rule.message);
          } else if (typeof val === 'string' && val.length < rule.value) {
            newErrors.push(rule.message);
          }
          break;
        case 'max':
          if (type === 'number' && val > rule.value) {
            newErrors.push(rule.message);
          } else if (typeof val === 'string' && val.length > rule.value) {
            newErrors.push(rule.message);
          }
          break;
        case 'pattern':
          if (typeof val === 'string' && !new RegExp(rule.value).test(val)) {
            newErrors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(val)) {
            newErrors.push(rule.message);
          }
          break;
      }
    });

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    return newErrors.length === 0;
  }, [validation, type]);

  React.useEffect(() => {
    validateField(value);
  }, [value, validateField]);

  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderValidationIcon = () => {
    if (errors.length > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (value && isValid) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const renderField = () => {
    const baseInputClass = `
      transition-all duration-200 ease-in-out
      ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
      ${errors.length > 0 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
      ${isValid && value ? 'border-green-500' : ''}
      ${className}
    `;

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            name={name}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={baseInputClass}
          />
        );

      case 'select':
        return (
          <Select 
            name={name}
            value={value} 
            onValueChange={handleChange}
            disabled={disabled}
          >
            <SelectTrigger className={baseInputClass}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'switch':
        return (
          <div className="flex items-center space-x-3">
            <Switch
              name={name}
              checked={value}
              onCheckedChange={handleChange}
              disabled={disabled}
            />
            <Badge variant={value ? 'default' : 'secondary'}>
              {value ? 'Bật' : 'Tắt'}
            </Badge>
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              name={name}
              type={showPassword ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              min={min}
              max={max}
              step={step}
              className={`${baseInputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        );

      default:
        return (
          <div className="relative">
            {prefix && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                {prefix}
              </div>
            )}
            <Input
              name={name}
              type={type}
              value={value || ''}
              onChange={(e) => handleChange(type === 'number' ? Number(e.target.value) : e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              min={min}
              max={max}
              step={step}
              className={`${baseInputClass} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
            />
            {suffix && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm">
                {suffix}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {Icon && <Icon className="h-4 w-4" />}
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="flex items-center gap-2">
          {renderValidationIcon()}
          {preview && type !== 'switch' && value && (
            <Badge variant="outline" className="text-xs">
              {type === 'number' ? value.toLocaleString() : value.toString().slice(0, 20)}
              {value.toString().length > 20 && '...'}
            </Badge>
          )}
        </div>
      </div>

      {renderField()}

      <AnimatePresence>
        {description && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md"
          >
            <Info className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {description}
            </p>
          </motion.div>
        )}

        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 
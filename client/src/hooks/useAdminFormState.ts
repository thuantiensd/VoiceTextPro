import { useState, useEffect } from "react";

interface UseAdminFormStateOptions<T> {
  initialData?: T;
  onSave: (data: T) => void;
}

export function useAdminFormState<T>({ initialData, onSave }: UseAdminFormStateOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<T | null>(null);
  const [currentData, setCurrentData] = useState<T | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);

  // Cập nhật data khi initialData thay đổi
  useEffect(() => {
    if (initialData && !originalData) {
      setOriginalData(initialData);
      setCurrentData(initialData);
      setHasChanges(false);
    }
  }, [initialData, originalData]);

  // Hàm để reset form về giá trị ban đầu
  const handleReset = () => {
    if (originalData) {
      setCurrentData(originalData);
      setHasChanges(false);
    }
  };

  // Hàm để track thay đổi form với controlled input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Cho phép input number lưu trữ string trong quá trình chỉnh sửa
    // Chỉ convert sang number khi submit
    const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;
    
    setCurrentData(prev => ({
      ...prev as T,
      [name]: finalValue
    }));
    
    console.log("Form changed:", name, "=", finalValue);
    setHasChanges(true);
  };

  // Hàm xử lý switch/checkbox change
  const handleSwitchChange = (name: string, checked: boolean) => {
    setCurrentData(prev => ({
      ...prev as T,
      [name]: checked
    }));
    
    if (!hasChanges) {
      setHasChanges(true);
    }
  };

  // Hàm xử lý confirm save
  const handleConfirmSave = () => {
    if (pendingData) {
      setShowConfirmDialog(false);
      setIsSubmitting(true);
      onSave(pendingData);
    }
  };

  // Hàm xử lý submit form với data processing
  const handleSubmit = (data: T) => {
    setIsSubmitting(true);
    
    // Lưu data và hiển thị dialog xác nhận
    setPendingData(data);
    setShowConfirmDialog(true);
    setIsSubmitting(false);
  };

  // Hàm reset state sau khi save thành công
  const resetFormState = () => {
    console.log("Resetting form state...");
    setIsSubmitting(false);
    setHasChanges(false);
    setPendingData(null);
    console.log("Form state reset completed - hasChanges should be false now");
  };

  return {
    isSubmitting,
    hasChanges,
    originalData,
    currentData,
    showConfirmDialog,
    pendingData,
    setIsSubmitting,
    setHasChanges,
    setCurrentData,
    setShowConfirmDialog,
    setPendingData,
    handleReset,
    handleInputChange,
    handleSwitchChange,
    handleConfirmSave,
    handleSubmit,
    resetFormState,
  };
}
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      } bg-blue-600 hover:bg-blue-700 text-white border-0`}
      size="icon"
      aria-label="Trở về đầu trang"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  );
}
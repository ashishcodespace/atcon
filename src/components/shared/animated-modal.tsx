"use client";

import { ReactNode, useEffect, useState } from "react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function AnimatedModal({ isOpen, onClose, children }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = "auto";
      }, 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = "auto";
    }
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className={clsx(
          "absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 cursor-pointer",
          isClosing ? "opacity-0" : "opacity-100"
        )} 
        onClick={onClose} 
      />
      
      {/* Content wrapper taking up no exact size itself, deferring to children */}
      <div 
        className={clsx(
          "relative transition-all duration-300 w-full flex justify-center max-h-[90vh]",
          isClosing ? "opacity-0 scale-[0.97] translate-y-2 blur-[2px]" : "opacity-100 scale-100 translate-y-0 blur-0"
        )}
      >
        <div className="w-full h-full flex justify-center items-center">
            {children}
        </div>
      </div>
    </div>
  );
}

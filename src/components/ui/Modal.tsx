import React, { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    icon?: React.ReactNode;
}

const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    '2xl': 'modal-2xl'
};

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    subtitle,
    children, 
    footer,
    size = 'md',
    icon
}) => {
    const [visible, setVisible] = useState(false);
    const [render, setRender] = useState(false);

    // Bloquear scroll del body cuando el modal está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setRender(true);
            // Pequeño delay para animación de entrada
            const timer = setTimeout(() => setVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            document.body.classList.remove('modal-open');
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    // Cerrar con Escape
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!render) return null;

    return (
        <div 
            className={`modal-overlay transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Panel del Modal */}
            <div 
                className={`modal-panel ${sizeClasses[size]} transform transition-all duration-200 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
            >
                {/* Header - SIEMPRE visible */}
                <div className="modal-header flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon && (
                            <div className="p-2 bg-gradient-to-br from-primary to-blue-600 rounded-xl text-white shadow-lg shadow-primary/20 shrink-0">
                                {icon}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 id="modal-title" className="text-base font-bold text-white tracking-tight truncate">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors shrink-0"
                        aria-label="Cerrar modal"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body - ÚNICO elemento scrollable */}
                <div className="modal-body">
                    <div className="p-5 sm:p-6">
                        {children}
                    </div>
                </div>

                {/* Footer - SIEMPRE visible (opcional) */}
                {footer && (
                    <div className="modal-footer flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

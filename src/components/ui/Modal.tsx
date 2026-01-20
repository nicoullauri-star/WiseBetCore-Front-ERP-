import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const [visible, setVisible] = useState(false);
    const [render, setRender] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            const timer = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full max-w-lg lg:max-w-xl bg-[#0f1115] border border-white/10 rounded-[2rem] shadow-2xl shadow-primary/5 flex flex-col max-h-[90vh] transform transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#151b26]/50 backdrop-blur-xl shrink-0 rounded-t-[2rem]">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight pl-2 border-l-4 border-primary">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

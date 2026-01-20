import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    icon,
    className = '',
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-[#00ff88] text-black hover:bg-[#00e67a] shadow-[#00ff88]/10',
        secondary: 'bg-[#121212] text-white border border-[#1f1f1f] hover:border-[#333]',
        danger: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20',
        ghost: 'bg-transparent text-[#666] hover:text-white',
    };

    return (
        <button
            className={`
                relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl 
                text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100
                ${variants[variant]} ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            {!isLoading && icon}
            {children}
        </button>
    );
};

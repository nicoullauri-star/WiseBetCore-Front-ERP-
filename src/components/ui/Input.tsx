import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, error, className = '', ...props }, ref) => {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">{label}</label>}
            <input
                ref={ref}
                className={`w-full bg-[#050505] border border-[#1f1f1f] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all ${error ? 'border-rose-500' : ''} ${className}`}
                {...props}
            />
            {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
        </div>
    );
});

Input.displayName = 'Input';

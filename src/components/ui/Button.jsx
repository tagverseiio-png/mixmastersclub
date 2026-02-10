import React from 'react';

const Button = ({ children, variant = 'primary', className = '', onClick }) => {
    const baseStyle = "px-12 py-5 font-['Montserrat'] text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-1000 ease-out relative overflow-hidden group cursor-pointer";

    const variants = {
        primary: "text-white border border-[#C5A059]/50 hover:border-[#C5A059]",
        secondary: "text-gray-500 hover:text-[#C5A059] border border-transparent",
        gold: "bg-[#C5A059] text-black hover:bg-white transition-colors duration-500",
    };

    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
            <span className="relative z-10 flex items-center gap-4 justify-center group-hover:tracking-[0.4em] transition-all duration-700">
                {children}
            </span>
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-[#C5A059] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-right duration-700 ease-out -z-0 opacity-10"></div>
            )}
        </button>
    );
};

export default Button;

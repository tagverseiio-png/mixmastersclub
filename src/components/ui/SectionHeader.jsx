import React from 'react';

const SectionHeader = ({ title, subtitle, center = false }) => (
    <div className={`mb-24 ${center ? 'text-center' : 'text-left'} relative`}>
        {subtitle && (
            <span className="block font-['Montserrat'] text-[#C5A059] text-[10px] font-medium tracking-[0.4em] uppercase mb-6">
                {subtitle}
            </span>
        )}
        <h2 className="font-['Cinzel'] text-5xl md:text-7xl text-white leading-none font-normal tracking-wide">
            {title}
        </h2>
    </div>
);

export default SectionHeader;

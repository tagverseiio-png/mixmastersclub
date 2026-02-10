import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import { Disc } from 'lucide-react';

const FormatView = ({ navigateTo, formats = [] }) => (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#080808]">
        <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader title="The Format" subtitle="Competition Structure" center />
            <div className="grid md:grid-cols-3 gap-px bg-[#C5A059]/20 border border-[#C5A059]/20">
                {formats.map((f, i) => (
                    <div key={i} className="bg-[#050505] p-8 md:p-16 hover:bg-[#0a0a0a] transition-all group text-center flex flex-col items-center">
                        <div className="text-[#C5A059] mb-8 group-hover:scale-110 transition-transform duration-700">
                            <Disc size={32} strokeWidth={1} />
                        </div>
                        <h3 className="font-['Cinzel'] text-2xl text-white mb-6">{f.title}</h3>
                        <p className="font-['Cormorant_Garamond'] text-lg text-gray-500 italic leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
            <div className="mt-16 md:mt-32 text-center">
                <p className="font-['Cormorant_Garamond'] text-2xl text-gray-400 italic mb-12 opacity-80">"One Stage. Three Disciplines. One Champion."</p>
                <Button variant="primary" onClick={() => navigateTo('register')}>Register Now</Button>
            </div>
        </div>
    </div>
);

export default FormatView;

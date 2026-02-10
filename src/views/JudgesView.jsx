import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';

const JudgesView = ({ judges = [] }) => (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505]">
        <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader title="The Council" subtitle="Arbiters of Taste" center />
            <div className="grid md:grid-cols-3 gap-10 md:gap-12">
                {judges.map((judge, idx) => (
                    <div key={judge.id} className={`group relative flex flex-col ${idx === 1 ? 'md:mt-24' : ''}`}>
                        <div className="relative mb-8 overflow-hidden w-full aspect-[3/4] bg-[#0a0a0a]">
                            {judge.mediaType === 'video' ? (
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    poster={judge.image}
                                    className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1500ms] ease-out transform group-hover:scale-105"
                                >
                                    <source src={judge.mediaUrl} type="video/mp4" />
                                </video>
                            ) : (
                                <img src={judge.mediaUrl || judge.image} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[1500ms] ease-out transform group-hover:scale-105" />
                            )}
                            <div className="absolute inset-4 border border-[#C5A059]/0 group-hover:border-[#C5A059]/40 transition-all duration-1000 z-10"></div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-['Cinzel'] text-2xl md:text-3xl text-white mb-2">{judge.name}</h3>
                            <p className="font-['Montserrat'] text-[#C5A059] text-[9px] uppercase tracking-[0.15em] md:tracking-[0.25em] mb-4">{judge.title}</p>
                            <p className="font-['Cormorant_Garamond'] text-lg text-gray-500 italic max-w-xs mx-auto opacity-60 group-hover:opacity-100 transition-opacity">"{judge.quote}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default JudgesView;

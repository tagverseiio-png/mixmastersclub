import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';

const SponsorsView = ({ navigateTo, sponsors = [] }) => {
    const hasSponsors = sponsors && sponsors.length > 0;

    return (
        <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505]">
            <div className="container mx-auto px-4 sm:px-6 text-center">
                <SectionHeader title="Partners" subtitle="In Collaboration" center />
                {!hasSponsors ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="text-center">
                            <h2 className="font-['Cinzel'] text-3xl md:text-5xl text-white mb-6 tracking-[0.1em]">REVEAL SOON</h2>
                            <p className="font-['Montserrat'] text-gray-500 text-sm md:text-base uppercase tracking-[0.2em] max-w-md mx-auto">
                                Partnership announcements coming closer to the event.
                            </p>
                            <div className="h-px w-16 bg-[#C5A059]/50 mx-auto mt-8" />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 md:gap-20 max-w-5xl mx-auto items-center">
                            {sponsors.map((p, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <h4 className="font-['Cinzel'] text-xl md:text-2xl text-gray-500 group-hover:text-white transition-colors duration-700">{p.name}</h4>
                                    <p className="font-['Montserrat'] text-[9px] text-[#C5A059] uppercase tracking-[0.2em] mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">{p.role}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-16 md:mt-32 border-t border-white/10 pt-10 md:pt-16">
                            <p className="font-['Montserrat'] text-gray-500 text-[10px] uppercase tracking-widest mb-8">Partnership Inquiries</p>
                            <Button variant="secondary" onClick={() => navigateTo('contact')}>Request Deck</Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SponsorsView;

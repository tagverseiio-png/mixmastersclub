import React, { useState } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

const EventsView = ({ events = [], onSelectEvent }) => {
    const [filter, setFilter] = useState('all'); // all, upcoming, active, completed

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        return (event.status || '').toLowerCase() === filter;
    });

    const statusClass = (status) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'active') return 'text-emerald-300';
        if (normalized === 'upcoming') return 'text-[#C5A059]';
        return 'text-gray-500';
    };

    return (
        <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505]">
            <div className="container mx-auto px-4 sm:px-6">
                <SectionHeader title="The Calendar" subtitle="Global Circuit" center />

                {/* Filter Tabs */}
                <div className="flex justify-center mb-12 md:mb-16 gap-4 md:gap-8 flex-wrap">
                    {['all', 'upcoming', 'active', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`font-['Montserrat'] text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${filter === f ? 'text-[#C5A059] border-b border-[#C5A059] pb-2' : 'text-gray-600 hover:text-white pb-2'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Events Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {filteredEvents.map((event) => (
                        <div key={event.id} className="group bg-[#0a0a0a] border border-white/5 hover:border-[#C5A059]/50 transition-all duration-500 overflow-hidden flex flex-col">
                            <div className="relative h-64 overflow-hidden">
                                {event.mediaType === 'video' ? (
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        poster={event.posterUrl || event.image}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110"
                                    >
                                        <source src={event.mediaUrl} type="video/mp4" />
                                    </video>
                                ) : (
                                    <img src={event.mediaUrl || event.image} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 transform group-hover:scale-110" />
                                )}
                                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 border border-white/10">
                                    <span className={`font-['Montserrat'] text-[9px] uppercase tracking-widest ${statusClass(event.status)}`}>
                                        {event.status}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8 flex-grow flex flex-col">
                                <h3 className="font-['Cinzel'] text-xl text-white mb-4 group-hover:text-[#C5A059] transition-colors">{event.title}</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <Calendar size={14} />
                                        <span className="font-['Montserrat'] text-[10px] uppercase tracking-widest">{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-500">
                                        <MapPin size={14} />
                                        <span className="font-['Montserrat'] text-[10px] uppercase tracking-widest">{event.location}</span>
                                    </div>
                                </div>

                                <p className="font-['Cormorant_Garamond'] text-gray-400 italic mb-8 line-clamp-2">{event.description}</p>

                                <div className="mt-auto">
                                    <button
                                        onClick={() => onSelectEvent(event)}
                                        className="flex items-center gap-2 font-['Montserrat'] text-[10px] uppercase tracking-[0.2em] text-white hover:text-[#C5A059] transition-colors group/btn"
                                    >
                                        View Details <ArrowRight size={12} className="transform group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventsView;

import React from 'react';
import { Calendar, MapPin, ChevronLeft, Share2, Radio } from 'lucide-react';
import Button from '../components/ui/Button';

const EventDetailView = ({ event, onBack, navigateTo }) => {
    if (!event) return null;

    // Convert YouTube URL to embed URL
    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            let videoId = null;
            
            // Handle youtube.com/watch?v=VIDEO_ID
            if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('v')) {
                videoId = urlObj.searchParams.get('v');
            }
            // Handle youtu.be/VIDEO_ID
            else if (urlObj.hostname === 'youtu.be') {
                videoId = urlObj.pathname.slice(1);
            }
            // Handle youtube.com/live/VIDEO_ID
            else if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/live/')) {
                videoId = urlObj.pathname.split('/live/')[1];
            }
            
            return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&modestbranding=1&rel=0` : null;
        } catch {
            return null;
        }
    };

    const embedUrl = getYouTubeEmbedUrl(event.liveStreamUrl);

    return (
        <div className="pt-24 md:pt-32 pb-16 md:pb-24 min-h-screen bg-[#050505] animate-fade-in">
            {/* Banner */}
            <div className="relative h-[55vh] md:h-[60vh] min-h-[380px] md:min-h-[500px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-black/50 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
                {event.mediaType === 'video' ? (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={event.posterUrl || event.image}
                        className="w-full h-full object-cover grayscale opacity-70"
                    >
                        <source src={event.mediaUrl} type="video/mp4" />
                    </video>
                ) : (
                    <img src={event.mediaUrl || event.image} className="w-full h-full object-cover grayscale opacity-70" />
                )}

                <div className="absolute inset-0 z-20 container mx-auto px-4 sm:px-6 flex flex-col justify-end pb-14 md:pb-24">
                    <button
                        onClick={onBack}
                        className="absolute top-8 md:top-12 left-4 sm:left-6 md:left-0 flex items-center gap-2 text-white/60 hover:text-[#C5A059] transition-colors font-['Montserrat'] text-[10px] uppercase tracking-[0.2em]"
                    >
                        <ChevronLeft size={16} /> Back to Events
                    </button>

                    <div className="max-w-4xl">
                        <span className="inline-block px-4 py-2 border border-[#C5A059] text-[#C5A059] font-['Montserrat'] text-[10px] uppercase tracking-[0.25em] mb-6 backdrop-blur-md">
                            {event.status}
                        </span>
                        <h1 className="font-['Cinzel'] text-4xl md:text-7xl text-white mb-6 md:mb-8 leading-none">{event.title}</h1>
                        <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-gray-300">
                            <div className="flex items-center gap-4">
                                <Calendar className="text-[#C5A059]" />
                                <span className="font-['Montserrat'] text-sm tracking-widest uppercase">{event.date}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <MapPin className="text-[#C5A059]" />
                                <span className="font-['Montserrat'] text-sm tracking-widest uppercase">{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Stream Embed */}
            {embedUrl && (
                <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 border-b border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <Radio size={20} className="text-red-500 animate-pulse" />
                        <h2 className="font-['Cinzel'] text-2xl md:text-3xl text-white">Live Stream</h2>
                    </div>
                    <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src={embedUrl}
                            className="absolute top-0 left-0 w-full h-full border border-white/10"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title="Live Stream"
                        />
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 grid md:grid-cols-3 gap-10 md:gap-16">
                <div className="md:col-span-2 space-y-12">
                    <div>
                        <h3 className="font-['Cinzel'] text-2xl text-white mb-6">Briefing</h3>
                        <p className="font-['Cormorant_Garamond'] text-xl text-gray-400 leading-relaxed italic border-l border-[#C5A059] pl-6">
                            "{event.description}"
                        </p>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <p className="font-['Montserrat'] text-gray-500 text-xs leading-loose tracking-wide text-justify">
                            Join us for an unforgettable night of sonic mastery. This event brings together the finest talent from across the region to compete specifically in the Open Format category. Expect high-energy sets, technical scratching, and seamless transitions as DJs battle for a spot in the Grand Finale.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-[#0a0a0a] border border-white/5 p-8 space-y-8">
                        <div>
                            <span className="block font-['Montserrat'] text-[10px] text-gray-500 uppercase tracking-widest mb-2">Entry</span>
                            <span className="font-['Cinzel'] text-2xl text-white">{event.price}</span>
                        </div>

                        {event.status !== 'Completed' ? (
                            <Button variant="gold" className="w-full" onClick={() => navigateTo('register', 'artist', event)}>Register Now</Button>
                        ) : (
                            <Button variant="secondary" className="w-full" onClick={() => navigateTo('results')}>View Results</Button>
                        )}

                        <div className="border-t border-white/5 pt-6 flex justify-between items-center">
                            <span className="font-['Montserrat'] text-[10px] text-gray-500 uppercase tracking-widest">Share Event</span>
                            <Share2 size={16} className="text-gray-500 hover:text-white cursor-pointer transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailView;

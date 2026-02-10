import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';

const ABOUT_POSTER_URL = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=1200';
const ABOUT_VIDEO_URL = '/hero-nightlife.mp4';
const ABOUT_IMAGE_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200';

const AboutView = ({ settings = {} }) => {
    const normalizeUrl = (value) => (typeof value === 'string' ? value.trim() : '');
    const mediaType = settings.aboutMediaType === 'image' ? 'image' : 'video';
    const mediaUrl = normalizeUrl(settings.aboutMediaUrl);
    const posterUrl = normalizeUrl(settings.aboutPosterUrl) || ABOUT_POSTER_URL;
    const resolvedVideoUrl = mediaType === 'video' ? (mediaUrl || ABOUT_VIDEO_URL) : '';
    const resolvedImageUrl = mediaType === 'image' ? (mediaUrl || ABOUT_IMAGE_URL) : '';

    return (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505]">
        <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader title="The Legacy" subtitle="Who We Are" center />
            <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
                <div className="space-y-10">
                    <p className="font-['Cormorant_Garamond'] text-2xl md:text-3xl text-gray-300 italic leading-relaxed font-light border-l border-[#C5A059] pl-6 md:pl-8">
                        "Mix Masters 2026 is a first-of-its-kind international Tamil DJ showdown, making its debut in May 2026 at Hard Rock Cafe, Singapore."
                    </p>
                    <div className="font-['Montserrat'] text-gray-500 text-xs leading-loose tracking-wide md:tracking-widest space-y-8 pl-6 md:pl-8 text-justify">
                        <p>This is not just another DJ battle. <span className="text-[#C5A059]">This is a global stage.</span> For the first time, DJs from across the world will compete under one roof—representing Canada, the United States, Europe, Australia, India, Malaysia, Sri Lanka, and beyond.</p>
                        <p>MixMasters 2026 is built to spotlight skill, originality, crowd control, and musical identity. Whether it’s technical mastery, seamless transitions, or the ability to move a room, this competition is about discovering DJs who stand out—not just locally, but internationally.</p>
                    </div>
                </div>
                <div className="relative h-[360px] sm:h-[500px] md:h-[600px] bg-[#0a0a0a] group overflow-hidden">
                    <div className="absolute inset-4 border border-[#C5A059]/20 z-20 transition-all duration-700 group-hover:inset-8"></div>
                    {mediaType === 'image' ? (
                        <img
                            src={resolvedImageUrl}
                            className="w-full h-full object-cover grayscale contrast-125 opacity-60 group-hover:opacity-100 transition-all duration-1000"
                        />
                    ) : (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            poster={posterUrl || undefined}
                            className="w-full h-full object-cover grayscale contrast-125 opacity-60 group-hover:opacity-100 transition-all duration-1000"
                        >
                            <source src={resolvedVideoUrl} type="video/mp4" />
                        </video>
                    )}
                </div>
            </div>
        </div>
    </div>
    );
};

export default AboutView;

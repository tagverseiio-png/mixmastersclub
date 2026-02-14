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
                        "Welcome to MixMasters Club International Tamil DJ Battle — a stage where culture, creativity, and competition collide."
                    </p>
                    <div className="font-['Montserrat'] text-gray-500 text-xs leading-loose tracking-wide md:tracking-widest space-y-8 pl-6 md:pl-8 text-justify">
                        <p>Founded and powered by Double B, this battle is more than an event; it’s a global movement celebrating the artistry of DJing and the pride of Tamil identity.</p>
                        <p>Our mission is to spotlight DJs who bring more than just beats—they bring stories, energy, and innovation. Every round is designed to test skill, showcase originality, and ignite the crowd. From technical mastery to musical storytelling, this battle raises the bar for what it means to be a DJ in today’s world.</p>
                        <p>At the heart of MixMasters Club is unity through sound. We bring together underground talent and established names from across the globe, creating a platform where tradition meets modernity, and local pride meets international prestige.</p>
                        <p>We are not just hosting a competition—we are building a community. A community that honors the craft, respects the culture, and amplifies voices from Tamil heritage onto the world stage.</p>
                        <p className="text-gray-300 font-semibold tracking-widest">This is where DJs become legends. This is MixMasters Club International Tamil DJ Battle.</p>
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

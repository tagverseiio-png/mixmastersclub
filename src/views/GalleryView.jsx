import React from 'react';
import { Instagram } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';

const GalleryView = ({ gallery = [] }) => (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#020202]">
        <div className="container mx-auto px-4 sm:px-6">
            <SectionHeader title="The Archive" subtitle="Visual History" center />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {gallery.map((item, i) => (
                    <div
                        key={i}
                        className={`relative h-[320px] sm:h-[440px] md:h-[600px] overflow-hidden group ${item.instagramUrl ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                            if (item.instagramUrl) {
                                window.open(item.instagramUrl, '_blank', 'noopener,noreferrer');
                            }
                        }}
                    >
                        {item.type === 'video' ? (
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                poster={item.poster}
                                className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-[2000ms] ease-out"
                            >
                                <source src={item.url} type="video/mp4" />
                            </video>
                        ) : (
                            <img src={item.url} className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 transition-all duration-[2000ms] ease-out" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                            <div className="w-20 h-20 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                                <Instagram className="text-white" size={24} strokeWidth={1} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default GalleryView;

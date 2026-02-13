import React, { useEffect, useMemo, useRef, useState } from 'react';
import FadeIn from '../components/ui/FadeIn';
import Button from '../components/ui/Button';
import SectionHeader from '../components/ui/SectionHeader';
import Logo from '../assets/Icon.svg';
import HeroIMage from '../assets/Hero.svg';

const HeroVideoLayer = ({ sources, poster, isCustomHero }) => {
    const [heroVideoIndex, setHeroVideoIndex] = useState(0);
    const videoRef = useRef(null);
    const currentSource = sources[heroVideoIndex] || '';

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const tryPlay = async () => {
            try {
                await video.play();
            } catch {
                // Autoplay can be restricted on some environments.
            }
        };
        tryPlay();
    }, [currentSource]);

    if (!currentSource) {
        return null;
    }

    return (
        <video
            ref={videoRef}
            key={currentSource}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={poster || undefined}
            onError={() => {
                setHeroVideoIndex((prev) => (prev + 1) % sources.length);
            }}
            className={`w-full h-full object-cover transition-all duration-500 ${isCustomHero ? 'opacity-100 grayscale-0 contrast-100' : 'opacity-60 grayscale contrast-125'}`}
        >
            <source src={currentSource} type="video/mp4" />
        </video>
    );
};

const HomeView = ({ navigateTo, mainEvent, judges = [], sponsors = [], settings = {} }) => {
    const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00' });

    useEffect(() => {
        if (!mainEvent?.date) return;

        const calculateTimeLeft = () => {
            const eventDate = new Date(mainEvent.date);
            // If date string doesn't include time, assume midnight of that day
            const difference = eventDate.getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0'),
                    hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
                    minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
                });
            } else {
                setTimeLeft({ days: '00', hours: '00', minutes: '00' });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
        return () => clearInterval(timer);
    }, [mainEvent]);

    const normalizeUrl = (value) => (typeof value === 'string' ? value.trim() : '');
    const eventVideo =
        mainEvent && mainEvent.mediaType === 'video' ? normalizeUrl(mainEvent.mediaUrl) : '';
    const mainEventVideo =
        normalizeUrl(settings.heroVideoUrl) || eventVideo || '';
    const mainEventPoster =
        normalizeUrl(settings.heroPosterUrl) || normalizeUrl(mainEvent?.posterUrl) || normalizeUrl(mainEvent?.image) || '';
    const heroVideoSources = useMemo(() => {
        const candidates = [
            settings.heroVideoUrl || '',
            eventVideo || '',
        ];
        return [...new Set(candidates.filter(Boolean))];
    }, [settings.heroVideoUrl, eventVideo]);
    const isCustomHero = Boolean(settings.heroVideoUrl);
    const visionTitle = settings.visionTitle || (mainEvent ? mainEvent.title : 'The Vision');
    const visionSubtitle = settings.visionSubtitle || (mainEvent ? `${mainEvent.date} • ${mainEvent.location}` : 'Mix Masters 2026');
    const visionImageUrl = normalizeUrl(settings.visionImageUrl);
    const visionQuote = settings.visionQuote || (mainEvent
        ? mainEvent.description
        : 'Where sonic artistry meets timeless prestige.');
    const visionBody = settings.visionBody || (mainEvent
        ? `${mainEvent.title} is currently featured as the flagship showcase across the platform. Keep this event updated in Admin to refresh Home media and messaging instantly.`
        : 'Mix Masters is a one-time global DJ competition built to spotlight skill, originality, creativity, and live crowd control on one stage.');

    return (
        <>
        <section className="relative h-screen min-h-[680px] md:min-h-[900px] flex items-center justify-center overflow-hidden bg-[#020202]">
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className={`absolute inset-0 z-10 ${isCustomHero ? 'bg-black/35' : 'bg-black/60'}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-10" />
                <HeroVideoLayer
                    key={heroVideoSources[0] || 'hero-default'}
                    sources={heroVideoSources}
                    poster={mainEventPoster}
                    isCustomHero={isCustomHero}
                />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-20 flex flex-col items-center">
                <FadeIn delay={200}>
                    <div className="flex flex-col items-center mb-0">
                        <div className="w-52 h-44 sm:w-60 sm:h-48 md:w-72 md:h-56 lg:w-80 lg:h-64 overflow-hidden">
                            <img
                                src={HeroIMage}
                                alt="MMC Logo"
                                className="w-full h-full object-contain -translate-y-6 sm:-translate-y-8 opacity-90"
                            />
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={500}>
                    <h1 className="text-center mb-6 relative -mt-12 sm:-mt-14">
                        <span className="block font-['Cinzel'] text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[#C5A059] via-[#E5C580] to-[#8a701e] tracking-[0.03em] md:tracking-[0.05em] font-normal leading-[0.95]">
                            Mix Masters Club
                        </span>
                    </h1>
                </FadeIn>

                <FadeIn delay={800}>
                    <div className="flex flex-col items-center mb-14 md:mb-20">
                        <div className="h-px w-12 bg-[#C5A059]/40 mb-6" />
                        <p className="font-['Montserrat'] text-xs sm:text-sm md:text-base text-gray-400 uppercase tracking-[0.35em] md:tracking-[0.5em] text-center font-light leading-relaxed">
                            International Tamil DJ Battle
                        </p>
                        <div className="h-px w-12 bg-[#C5A059]/40 mt-6" />
                    </div>
                </FadeIn>

                <FadeIn delay={950}>
                    <span className="font-['Cinzel'] text-[#C5A059] text-xl md:text-2xl tracking-[0.3em] mb-12 block">2026</span>
                </FadeIn>

                <FadeIn delay={1100}>
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <Button variant="gold" onClick={() => navigateTo('register', 'artist')}>DJ Registration</Button>
                    </div>
                </FadeIn>
            </div>
        </section>
        </>
    );
};

export default HomeView;

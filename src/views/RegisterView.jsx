import React, { useMemo, useState } from 'react';
import { Check, Upload, ChevronLeft, Globe, Instagram, FileAudio } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../assets/Icon.svg';

const buildApiRoot = (apiBase) => {
    const normalized = (apiBase || '').replace(/\/$/, '');
    if (!normalized) return '';
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const RegisterView = ({ preSelectedRole = 'artist', preSelectedEventId = '', events = [], apiBase = '', navigateTo }) => {
    const [role, setRole] = useState('artist');
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        nationality: '',
        age: '',
        stageName: '',
        instagram: '',
        experience: '',
        soundCloud: '',
        demoFile: null,
        activeEventId: '',
    });
    const [uploadError, setUploadError] = useState('');

    const activeEvents = useMemo(
        () => events.filter((event) => (event?.status || '').toLowerCase() === 'active'),
        [events]
    );
    const preferredActiveEvent = activeEvents.find((event) => String(event.id) === String(preSelectedEventId)) || activeEvents[0] || null;
    const currentActiveEventId = formData.activeEventId || (preferredActiveEvent ? String(preferredActiveEvent.id) : '');
    const selectedActiveEvent = activeEvents.find((event) => String(event.id) === String(currentActiveEventId)) || null;
    const eventDisplayName = 'MixMasters Club – International Tamil DJ Battle';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setUploadError('');
        
        if (file) {
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    window.URL.revokeObjectURL(video.src);
                    if (video.duration > 900) { // 15 minutes = 900 seconds
                        setUploadError('Video duration exceeds 15 minutes limit.');
                        return;
                    }
                    setFormData(prev => ({ ...prev, demoFile: file.name }));
                };
                video.src = URL.createObjectURL(file);
            } else {
                setFormData(prev => ({ ...prev, demoFile: file.name }));
            }
        }
    };

    const handleNext = () => {
        if (!selectedActiveEvent) {
            alert('No active event is available for registration right now.');
            return;
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = () => {
        if (!selectedActiveEvent) {
            alert('No active event is available for registration right now.');
            return;
        }

        const apiRoot = buildApiRoot(apiBase || import.meta.env.VITE_PUBLIC_API_BASE || '');
        if (!apiRoot) {
            alert('Backend API base is missing. Set VITE_PUBLIC_API_BASE.');
            return;
        }

        fetch(`${apiRoot}/public/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: 'artist',
                eventId: selectedActiveEvent.id,
                fullName: formData.fullName,
                email: formData.email,
                nationality: formData.nationality,
                age: formData.age,
                stageName: formData.stageName,
                instagram: formData.instagram,
                experience: formData.experience,
                soundCloud: formData.soundCloud,
                demoFile: formData.demoFile,
                source: 'website',
            }),
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(payload?.message || 'Registration failed');
                }
                alert(payload?.emailSent ? 'Registration saved and email sent.' : 'Registration saved. Email delivery is pending.');
                navigateTo('home');
            })
            .catch((error) => {
                alert(error.message || 'Registration failed');
            });
    };

    return (
        <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* DJ Battle Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C5A059] blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
                {step < 4 && (
                    <div className="flex flex-col items-center mb-20">
                        <img
                            src={Logo}
                            alt="MMC Logo"
                            className="w-24 h-24 md:w-28 md:h-28 object-contain mb-3 opacity-90"
                        />
                        <span className="font-['Cinzel'] text-[#C5A059] text-lg md:text-xl tracking-[0.3em]">2026</span>
                        <h1 className="mt-6 font-['Cinzel'] text-[clamp(1.4rem,4vw,3.5rem)] text-white tracking-[0.05em] text-center max-w-[32rem]">
                            {eventDisplayName}
                        </h1>
                        <div className="h-px w-16 bg-[#C5A059]/50 mt-4" />
                        <p className="mt-4 font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-[0.4em]">
                            DJ Battle Registration
                        </p>
                    </div>
                )}

                <div className="flex gap-2 mb-12 justify-center">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 w-20 transition-all duration-700 ${i <= step ? 'bg-[#C5A059] shadow-[0_0_10px_#C5A059]' : 'bg-white/5'}`} />
                    ))}
                </div>

                <div className="bg-[#0a0a0a] border-2 border-white/5 p-6 sm:p-8 md:p-16 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative min-h-[500px] flex flex-col backdrop-blur-sm">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/30" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/30" />

                    <div className="flex-grow animate-fade-in">
                        {step === 1 && (
                            <div className="space-y-8">
                                <div className="text-center mb-8">
                                    <h3 className="font-['Cinzel'] text-2xl text-white tracking-widest">PHASE 01: IDENTITY</h3>
                                    <div className="h-px w-24 bg-[#C5A059]/50 mx-auto mt-2" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Full Name</label>
                                            <input name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="REAL NAME" />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Stage Name / Alias</label>
                                            <input name="stageName" value={formData.stageName} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="[DJ stage name]" required />
                                        </div>
                                    </div>
                                    <div className="space-y-8">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Age</label>
                                            <input name="age" value={formData.age} onChange={handleInputChange} type="number" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="21+" />
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Secure Communication (Email)</label>
                                    <input name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="EMAIL@MASTER.CLUB" />
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Nationality</label>
                                    <div className="relative">
                                        <Globe className="absolute right-4 top-4 text-gray-600" size={16} />
                                        <input name="nationality" value={formData.nationality} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="CITIZENSHIP" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-8">
                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Stage Name / Alias</label>
                                    <input name="stageName" value={formData.stageName} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-2xl focus:border-[#C5A059] outline-none transition-all placeholder:opacity-30" placeholder="DJ BATTLE_READY" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Experience (Years)</label>
                                        <input name="experience" value={formData.experience} onChange={handleInputChange} type="number" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="5+" />
                                    </div>
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Instagram @Handle</label>
                                        <div className="relative">
                                            <Instagram className="absolute right-4 top-4 text-gray-600" size={16} />
                                            <input name="instagram" value={formData.instagram} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="@YOURNAME" />
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">SoundCloud / Mixcloud / Portfolio</label>
                                    <input name="soundCloud" value={formData.soundCloud} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="LINK TO YOUR BEST MIX" />
                                </div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-8">
                                <div className="text-center mb-8">
                                    <h3 className="font-['Cinzel'] text-2xl text-white tracking-widest">PHASE 03: SHOWCASE</h3>
                                    <div className="h-px w-24 bg-[#C5A059]/50 mx-auto mt-2" />
                                </div>

                                <div className={`group pt-12 pb-12 border-2 border-dashed ${uploadError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'} p-10 text-center hover:border-[#C5A059] transition-all cursor-pointer relative hover:bg-white/10`}>
                                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} accept="audio/*,video/*,.pdf" />
                                    {formData.demoFile ? (
                                        <div className="text-[#C5A059]">
                                            <FileAudio className="mx-auto mb-4 animate-bounce" size={48} />
                                            <span className="font-['Montserrat'] text-sm uppercase tracking-[0.2em] block">{formData.demoFile}</span>
                                            <span className="text-[10px] text-gray-500 mt-2 block uppercase tracking-widest">Click to change file</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <Upload className="mx-auto mb-4 group-hover:text-[#C5A059] transition-colors" size={48} />
                                            <span className="font-['Montserrat'] text-sm uppercase tracking-[0.2em] block group-hover:text-white transition-colors">Upload Demo Mix (MP4/MP3)</span>
                                            <span className="text-[10px] text-gray-600 mt-4 block uppercase tracking-[0.15em]">Video Limit: 15 Minutes | Max 80MB</span>
                                        </div>
                                    )}
                                </div>

                                {uploadError && (
                                    <p className="text-red-500 text-[10px] uppercase tracking-widest text-center animate-pulse">{uploadError}</p>
                                )}

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Cloud Storage Link (Alternative)</label>
                                    <input type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="GDRIVE / DROPBOX / WETRANSFER" />
                                </div>
                            </div>
                        )}
                        {step === 4 && (
                            <div className="space-y-8 py-4">
                                <div className="text-center">
                                    <span className="font-['Cinzel'] text-2xl md:text-3xl text-white tracking-[0.2em]">Enter the Arena</span>
                                </div>
                                <div className="text-center mb-8">
                                   
                                    <div className="w-20 h-20 border-2 border-[#C5A059] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(197,160,89,0.3)]"><Check className="text-[#C5A059]" size={32} /></div>
                                    <h3 className="font-['Cinzel'] text-3xl text-white mb-2 tracking-[0.1em]">FINAL REVIEW</h3>
                                    <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-[0.4em]">Prepare for Battle</p>
                                </div>

                                <div className="bg-[#0d0d0d] p-8 border border-white/10 space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A059]/5 blur-[40px] rounded-full" />
                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div className="col-span-2 border-b border-white/5 pb-4">
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Target Arena</span>
                                            <span className="font-['Cinzel'] text-white text-xl text-[#C5A059]">{eventDisplayName}</span>
                                        </div>
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Combatant</span>
                                            <span className="font-['Cinzel'] text-white text-lg">{formData.stageName || formData.fullName}</span>
                                        </div>
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Rank (Exp)</span>
                                            <span className="font-['Cinzel'] text-white text-lg">{formData.experience} Cycles</span>
                                        </div>
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Showcase File</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-sm break-all">{formData.demoFile || "PENDING"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!selectedActiveEvent && (
                        <div className="mt-8 rounded border-2 border-red-900 bg-red-900/10 px-4 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold">
                            SYSTEM OFFLINE: NO ACTIVE EVENTS DETECTED
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-14 pt-10 border-t border-white/5">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className={`uppercase tracking-[0.3em] text-[10px] font-['Montserrat'] flex items-center gap-2 transition-all hover:translate-x-[-4px] px-4 py-2 border ${step === 4
                                    ? 'text-white border-[#C5A059]/60 shadow-[0_0_12px_rgba(197,160,89,0.25)]'
                                    : 'text-gray-600 border-[#00ff00]/35 shadow-[0_0_10px_rgba(0,255,0,0.2)] hover:text-white'}
                                `}
                            >
                                <ChevronLeft size={14} /> RECALL
                            </button>
                        ) : <div />}

                        <Button 
                            variant="gold" 
                            className="px-8 py-4 shadow-[0_0_15px_rgba(197,160,89,0.2)] hover:shadow-[0_0_25px_rgba(197,160,89,0.4)] transition-all"
                            onClick={step < 4 ? handleNext : handleSubmit}
                        >
                            {step === 4 ? 'SUBMIT' : 'NEXT'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
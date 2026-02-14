import React, { useMemo, useState, useEffect } from 'react';
import { Check, ChevronLeft, Globe, Instagram, AlertCircle, CheckCircle, X, Info, AlertTriangle } from 'lucide-react';
import Herologo from '../assets/Hero.svg';

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
        instagram: '',
        experience: '',
        soundCloud: '',
        cloudLink: '',
        activeEventId: '',
    });
    const [alert, setAlert] = useState(null); // { type: 'error'|'warning'|'success'|'info', title: '', message: '' }
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false); // true after successful submit

    // Auto-dismiss alerts after 6 seconds
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => setAlert(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    const showAlert = (type, title, message) => {
        setAlert({ type, title, message });
    };

    const closeAlert = () => {
        setAlert(null);
    };

    const activeEvents = useMemo(
        () => events.filter((event) => (event?.status || '').toLowerCase() === 'active'),
        [events]
    );
    const preferredActiveEvent = activeEvents.find((event) => String(event.id) === String(preSelectedEventId)) || activeEvents[0] || null;
    const currentActiveEventId = formData.activeEventId || (preferredActiveEvent ? String(preferredActiveEvent.id) : '');
    const selectedActiveEvent = activeEvents.find((event) => String(event.id) === String(currentActiveEventId)) || null;
    const eventDisplayName = 'MixMasters Club International Tamil DJ Battle';

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (!selectedActiveEvent) {
            showAlert('warning', 'No Active Event', 'No active event is available for registration right now.');
            return;
        }
        if (step === 1) {
            const requiredStepOne = ['fullName', 'age', 'email', 'nationality'];
            const isMissing = requiredStepOne.some((field) => !formData[field]);
            if (isMissing) {
                showAlert('warning', 'Incomplete Form', 'Please complete all required fields before continuing.');
                return;
            }
        }
        if (step === 2) {
            const requiredStepTwo = ['experience', 'instagram', 'soundCloud'];
            const isMissing = requiredStepTwo.some((field) => !formData[field]);
            if (isMissing) {
                showAlert('warning', 'Incomplete Form', 'Please complete all required fields before continuing.');
                return;
            }
        }
        if (step === 3) {
            if (!formData.cloudLink) {
                showAlert('warning', 'Missing Demo Link', 'Please provide a cloud storage link before continuing.');
                return;
            }
        }
        setStep(prev => Math.min(prev + 1, 4));
    };

    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = () => {
        if (!selectedActiveEvent) {
            showAlert('warning', 'No Active Event', 'No active event is available for registration right now.');
            return;
        }

        const apiRoot = buildApiRoot(apiBase || import.meta.env.VITE_PUBLIC_API_BASE || '');
        if (!apiRoot) {
            showAlert('error', 'Configuration Error', 'Backend API base is missing. Please contact support.');
            return;
        }

        setIsSubmitting(true);

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
                instagram: formData.instagram,
                experience: formData.experience,
                soundCloud: formData.soundCloud,
                cloudLink: formData.cloudLink,
                source: 'website',
            }),
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) {
                    // Handle specific error codes
                    if (response.status === 409) {
                        throw new Error('You have already registered for this event with this email address.');
                    } else if (response.status === 400) {
                        throw new Error(payload?.message || 'Invalid registration data. Please check all fields.');
                    } else {
                        throw new Error(payload?.message || 'Registration failed. Please try again.');
                    }
                }
                showAlert('success', 'Registration Complete!', payload?.emailSent 
                    ? 'Your registration has been saved and confirmation email has been sent.' 
                    : 'Your registration has been saved. Confirmation email will be sent shortly.');
                setRegistrationSuccess(true);
                setStep(5);
            })
            .catch((error) => {
                showAlert('error', 'Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="pt-20 sm:pt-28 md:pt-40 pb-12 sm:pb-16 md:pb-24 min-h-screen bg-[#050505] flex items-center justify-center relative overflow-hidden">
            {/* Alert Toast */}
            {alert && (
                <div className="fixed top-16 sm:top-20 md:top-24 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-[9999] w-auto sm:w-[90%] max-w-lg animate-fade-in">
                    <div className={`
                        rounded-lg p-3 sm:p-4 shadow-2xl border-2 flex items-start gap-2 sm:gap-4
                        ${alert.type === 'error' ? 'bg-red-900/30 border-red-500/50 backdrop-blur-md' : ''}
                        ${alert.type === 'warning' ? 'bg-yellow-900/30 border-yellow-500/50 backdrop-blur-md' : ''}
                        ${alert.type === 'success' ? 'bg-green-900/30 border-green-500/50 backdrop-blur-md' : ''}
                        ${alert.type === 'info' ? 'bg-blue-900/30 border-blue-500/50 backdrop-blur-md' : ''}
                    `}>
                        <div className="flex-shrink-0 mt-0.5">
                            {alert.type === 'error' && <AlertCircle className="text-red-400" size={20} />}
                            {alert.type === 'warning' && <AlertTriangle className="text-yellow-400" size={20} />}
                            {alert.type === 'success' && <CheckCircle className="text-green-400" size={20} />}
                            {alert.type === 'info' && <Info className="text-blue-400" size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`
                                font-['Montserrat'] text-xs sm:text-sm uppercase tracking-[0.2em] font-semibold mb-0.5 sm:mb-1
                                ${alert.type === 'error' ? 'text-red-300' : ''}
                                ${alert.type === 'warning' ? 'text-yellow-300' : ''}
                                ${alert.type === 'success' ? 'text-green-300' : ''}
                                ${alert.type === 'info' ? 'text-blue-300' : ''}
                            `}>
                                {alert.title}
                            </h4>
                            <p className={`
                                text-xs sm:text-sm font-['Montserrat'] leading-relaxed
                                ${alert.type === 'error' ? 'text-red-200' : ''}
                                ${alert.type === 'warning' ? 'text-yellow-200' : ''}
                                ${alert.type === 'success' ? 'text-green-200' : ''}
                                ${alert.type === 'info' ? 'text-blue-200' : ''}
                            `}>
                                {alert.message}
                            </p>
                        </div>
                        <button
                            onClick={closeAlert}
                            className={`
                                flex-shrink-0 hover:bg-white/10 rounded p-1 transition-colors
                                ${alert.type === 'error' ? 'text-red-400 hover:text-red-300' : ''}
                                ${alert.type === 'warning' ? 'text-yellow-400 hover:text-yellow-300' : ''}
                                ${alert.type === 'success' ? 'text-green-400 hover:text-green-300' : ''}
                                ${alert.type === 'info' ? 'text-blue-400 hover:text-blue-300' : ''}
                            `}
                        >
                            <X size={16} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* DJ Battle Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#C5A059] blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900 blur-[120px] rounded-full animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
                {step < 4 && (
                    <div className="flex flex-col items-center mb-8 sm:mb-12 md:mb-16">
                        <img
                            src={Herologo}
                            alt="MMC Logo"
                            className="w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 object-contain opacity-90"
                        />
                        <h1 className="-mt-10 sm:-mt-16 md:-mt-20 font-['Cinzel'] text-[clamp(1.2rem,3.5vw,3rem)] text-white tracking-[0.05em] text-center max-w-[32rem]">
                            <span className="block sm:inline">MixMasters Club</span>{' '}
                            <span className="block sm:inline">International Tamil DJ Battle</span>
                        </h1>
                        <span className="font-['Cinzel'] text-[#C5A059] text-base sm:text-lg md:text-xl tracking-[0.3em] mt-1">2026</span>
                        <div className="h-px w-12 sm:w-16 bg-[#C5A059]/50 mt-2 sm:mt-4" />
                        <p className="mt-2 sm:mt-4 font-['Montserrat'] text-[9px] sm:text-[10px] text-[#C5A059] uppercase tracking-[0.4em]">
                            DJ Battle Registration
                        </p>
                    </div>
                )}

                <div className="flex gap-1 sm:gap-2 mb-8 sm:mb-12 justify-center">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 w-12 sm:w-20 transition-all duration-700 ${i <= step || registrationSuccess ? 'bg-[#C5A059] shadow-[0_0_10px_#C5A059]' : 'bg-white/5'}`} />
                    ))}
                </div>

                <div className="bg-[#0a0a0a] border-2 border-white/5 p-4 sm:p-6 md:p-8 lg:p-16 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative min-h-[450px] sm:min-h-[500px] flex flex-col backdrop-blur-sm">
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#C5A059]/30" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#C5A059]/30" />

                    <div className="flex-grow animate-fade-in">
                        {step === 1 && (
                            <div className="space-y-4 sm:space-y-8">
                                <div className="text-center mb-6 sm:mb-8">
                                    <h3 className="font-['Cinzel'] text-lg sm:text-2xl text-white tracking-widest">PHASE 01: IDENTITY</h3>
                                    <div className="h-px w-24 bg-[#C5A059]/50 mx-auto mt-2" />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                                    <div className="space-y-4 sm:space-y-8">
                                        <div className="group space-y-1 sm:space-y-2">
                                            <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Full Name</label>
                                            <input name="fullName" value={formData.fullName} onChange={handleInputChange} type="text" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="REAL NAME" />
                                        </div>
                                    </div>
                                    <div className="space-y-4 sm:space-y-8">
                                        <div className="group space-y-1 sm:space-y-2">
                                            <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Age</label>
                                            <input name="age" value={formData.age} onChange={handleInputChange} type="number" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="21+" />
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-1 sm:space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Secure Communication (Email)</label>
                                    <input name="email" value={formData.email} onChange={handleInputChange} type="email" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="EMAIL@MASTER.CLUB" />
                                </div>

                                <div className="group space-y-1 sm:space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Nationality</label>
                                    <div className="relative">
                                        <Globe className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-600" size={14} />
                                        <input name="nationality" value={formData.nationality} onChange={handleInputChange} type="text" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="CITIZENSHIP" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-4 sm:space-y-8">
                                <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                                    <div className="group space-y-1 sm:space-y-2">
                                        <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Experience (Years)</label>
                                        <input name="experience" value={formData.experience} onChange={handleInputChange} type="number" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="5+" />
                                    </div>
                                    <div className="group space-y-1 sm:space-y-2">
                                        <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Instagram @Handle</label>
                                        <div className="relative">
                                            <Instagram className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-600" size={14} />
                                            <input name="instagram" value={formData.instagram} onChange={handleInputChange} type="text" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="@YOURNAME" />
                                        </div>
                                    </div>
                                </div>

                                <div className="group space-y-1 sm:space-y-2">
                                    <label className="text-[9px] sm:text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">SoundCloud / Mixcloud / Portfolio</label>
                                    <input name="soundCloud" value={formData.soundCloud} onChange={handleInputChange} type="text" required className="w-full bg-[#0d0d0d] border border-white/10 px-3 sm:px-4 py-3 sm:py-4 text-white font-['Cinzel'] text-base sm:text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="LINK TO YOUR BEST MIX" />
                                </div>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-8">
                                <div className="text-center mb-8">
                                    <h3 className="font-['Cinzel'] text-2xl text-white tracking-widest">PHASE 03: SHOWCASE</h3>
                                    <div className="h-px w-24 bg-[#C5A059]/50 mx-auto mt-2" />
                                </div>

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Cloud Storage Link</label>
                                    <input name="cloudLink" value={formData.cloudLink} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="GDRIVE / DROPBOX / WETRANSFER" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Set link access to "Anyone with the link". Video limit: 10 minutes.</p>
                                    <p className="text-[10px] text-gray-200 uppercase tracking-[0.2em]">It is Compulsory each DJ's upload a video not exceeding 10min of their best set to showcase their strongest skills - Mixing, scratching, transition and tamil fusion creativity.</p>
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
                                            <span className="font-['Cinzel'] text-white text-lg">{formData.fullName}</span>
                                        </div>
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Rank (Exp)</span>
                                            <span className="font-['Cinzel'] text-white text-lg">{formData.experience} Cycles</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Cloud Link</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-sm break-all">{formData.cloudLink || "PENDING"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 5 && registrationSuccess && (
                            <div className="space-y-6 sm:space-y-8 py-6 sm:py-10 animate-fade-in">
                                <div className="text-center">
                                    <div className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-pulse">
                                        <CheckCircle className="text-green-400" size={48} />
                                    </div>
                                    <h3 className="font-['Cinzel'] text-2xl sm:text-3xl md:text-4xl text-white mb-3 tracking-[0.1em]">
                                        REGISTRATION COMPLETE
                                    </h3>
                                    <div className="h-px w-24 bg-[#C5A059]/50 mx-auto my-4" />
                                    <p className="font-['Montserrat'] text-xs sm:text-sm text-green-300 uppercase tracking-[0.3em] mb-2">
                                        You have been enlisted
                                    </p>
                                    <p className="font-['Montserrat'] text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed mt-4">
                                        A confirmation email has been sent to <span className="text-[#C5A059]">{formData.email}</span>.
                                        Please check your inbox (and spam folder) for further details.
                                    </p>
                                </div>

                                <div className="bg-[#0d0d0d] p-6 sm:p-8 border border-green-500/20 space-y-4 relative overflow-hidden rounded">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[40px] rounded-full" />
                                    <div className="grid grid-cols-2 gap-4 sm:gap-6 relative z-10">
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Combatant</span>
                                            <span className="font-['Cinzel'] text-white text-base sm:text-lg">{formData.fullName}</span>
                                        </div>
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Email</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-xs sm:text-sm break-all">{formData.email}</span>
                                        </div>
                                        <div className="col-span-2 border-t border-white/5 pt-4">
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Event</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-sm sm:text-base">{eventDisplayName}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center mt-6 sm:mt-8">
                                    <button
                                        onClick={() => navigateTo('home')}
                                        className="uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-['Montserrat'] flex items-center justify-center gap-2 transition-all px-8 sm:px-12 py-3 sm:py-4 bg-[#C5A059] text-black shadow-[0_0_12px_rgba(197,160,89,0.35)] hover:bg-[#E5C580]"
                                    >
                                        <CheckCircle size={14} /> RETURN HOME
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {!selectedActiveEvent && (
                        <div className="mt-8 rounded border-2 border-red-900 bg-red-900/10 px-4 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold">
                            SYSTEM OFFLINE: NO ACTIVE EVENTS DETECTED
                        </div>
                    )}

                    {!registrationSuccess && (
                    <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mt-8 sm:mt-14 pt-6 sm:pt-10 border-t border-white/5">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-['Montserrat'] flex items-center justify-center gap-1 sm:gap-2 transition-all hover:translate-x-[-4px] px-4 sm:px-6 py-3 sm:py-4 w-[48%] sm:w-auto sm:min-w-[180px] bg-[#C5A059] text-black shadow-[0_0_12px_rgba(197,160,89,0.35)] hover:bg-[#E5C580] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> BACK
                            </button>
                        ) : <div />}

                        <button
                            onClick={step < 4 ? handleNext : handleSubmit}
                            disabled={isSubmitting}
                            className="uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-['Montserrat'] flex items-center justify-center gap-1 sm:gap-2 transition-all hover:translate-x-[4px] px-4 sm:px-6 py-3 sm:py-4 w-[48%] sm:w-auto sm:min-w-[180px] bg-[#C5A059] text-black shadow-[0_0_12px_rgba(197,160,89,0.35)] hover:bg-[#E5C580] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'SUBMITTING...' : step === 4 ? 'SUBMIT' : 'NEXT'}
                        </button>
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
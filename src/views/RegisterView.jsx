import React, { useMemo, useState, useEffect } from 'react';
import { Check, Upload, ChevronLeft, Globe, Instagram, FileAudio, Loader2, AlertCircle, CheckCircle, X, Info, AlertTriangle } from 'lucide-react';
import Herologo from '../assets/hero.svg';

const buildApiRoot = (apiBase) => {
    const normalized = (apiBase || '').replace(/\/$/, '');
    if (!normalized) return '';
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    if (seconds < 60) return `${seconds}.${Math.floor(milliseconds / 100)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
        demoFileName: '',
        demoFileUrl: '',
        demoFileSize: 0,
        demoFileMime: '',
        activeEventId: '',
    });
    const [uploadError, setUploadError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadMetrics, setUploadMetrics] = useState({
        fileName: '',
        fileSize: 0,
        uploadedSize: 0,
        elapsedTime: 0,
        serverTime: 0,
    });
    const [alert, setAlert] = useState(null); // { type: 'error'|'warning'|'success'|'info', title: '', message: '' }

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

    const uploadDemoFile = async (file) => {
        const apiRoot = buildApiRoot(apiBase || import.meta.env.VITE_PUBLIC_API_BASE || '');
        if (!apiRoot) {
            setUploadError('Backend API base is missing. Set VITE_PUBLIC_API_BASE.');
            return;
        }

        const body = new FormData();
        body.append('media', file);

        setIsUploading(true);
        setUploadError('');
        setUploadSuccess(false);
        setUploadMetrics({
            fileName: file.name,
            fileSize: file.size,
            uploadedSize: 0,
            elapsedTime: 0,
            serverTime: 0,
        });

        const startTime = Date.now();
        let uploadInterval;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();

            // Track elapsed time
            uploadInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                setUploadMetrics(prev => ({ ...prev, elapsedTime: elapsed }));
            }, 100);

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    setUploadMetrics(prev => ({
                        ...prev,
                        uploadedSize: e.loaded,
                        fileSize: e.total,
                    }));
                }
            });

            xhr.addEventListener('load', () => {
                clearInterval(uploadInterval);
                const serverTime = Date.now() - startTime;

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const payload = JSON.parse(xhr.responseText);
                        setFormData(prev => ({
                            ...prev,
                            demoFileName: payload.fileName || file.name,
                            demoFileUrl: payload.url || '',
                            demoFileSize: payload.size || 0,
                            demoFileMime: payload.mimeType || file.type || '',
                        }));
                        setUploadMetrics(prev => ({ ...prev, serverTime }));
                        setUploadSuccess(true);
                        setTimeout(() => setUploadSuccess(false), 3000);
                    } catch (error) {
                        setUploadError('Failed to parse server response.');
                    }
                } else {
                    try {
                        const payload = JSON.parse(xhr.responseText);
                        setUploadError(payload?.message || `Upload failed with status ${xhr.status}`);
                    } catch {
                        setUploadError(`Upload failed with status ${xhr.status}`);
                    }
                }
                setIsUploading(false);
                resolve();
            });

            xhr.addEventListener('error', () => {
                clearInterval(uploadInterval);
                setUploadError('Network error occurred during upload. Please try again.');
                setIsUploading(false);
                resolve();
            });

            xhr.addEventListener('abort', () => {
                clearInterval(uploadInterval);
                setUploadError('Upload was cancelled.');
                setIsUploading(false);
                resolve();
            });

            xhr.open('POST', `${apiRoot}/public/registrations/upload`);
            xhr.send(body);
        });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        setUploadError('');

        if (!file) {
            return;
        }

        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                if (video.duration > 600) {
                    setUploadError('Video duration exceeds 10 minutes limit.');
                    return;
                }
                uploadDemoFile(file);
            };
            video.src = URL.createObjectURL(file);
            return;
        }

        uploadDemoFile(file);
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
            if (isUploading) {
                showAlert('info', 'Upload In Progress', 'Please wait for the upload to finish.');
                return;
            }
            if (!formData.demoFileUrl && !formData.cloudLink) {
                showAlert('warning', 'Missing Demo', 'Please upload a demo file or provide a cloud storage link before continuing.');
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
                demoFile: formData.demoFileName,
                demoFileUrl: formData.demoFileUrl,
                demoFileSize: formData.demoFileSize,
                demoFileMime: formData.demoFileMime,
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
                setTimeout(() => navigateTo('home'), 2000);
            })
            .catch((error) => {
                showAlert('error', 'Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
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
                        <h1 className="-mt-2 sm:-mt-4 font-['Cinzel'] text-[clamp(1.2rem,3.5vw,3rem)] text-white tracking-[0.05em] text-center max-w-[32rem]">
                            {eventDisplayName}
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
                        <div key={i} className={`h-1 w-12 sm:w-20 transition-all duration-700 ${i <= step ? 'bg-[#C5A059] shadow-[0_0_10px_#C5A059]' : 'bg-white/5'}`} />
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

                                <div className={`group pt-12 pb-12 border-2 border-dashed ${uploadError ? 'border-red-500/50 bg-red-500/5' : isUploading ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/10 bg-white/5'} p-10 text-center hover:border-[#C5A059] transition-all ${isUploading ? 'cursor-wait' : 'cursor-pointer'} relative hover:bg-white/10`}>
                                    <input 
                                        type="file" 
                                        className={`absolute inset-0 w-full h-full opacity-0 ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`} 
                                        onChange={handleFileUpload} 
                                        accept="audio/*,video/*,.pdf"
                                        disabled={isUploading}
                                    />
                                    {isUploading ? (
                                        <div className="text-[#C5A059]">
                                            <Loader2 className="mx-auto mb-4 animate-spin" size={48} />
                                            <span className="font-['Montserrat'] text-sm uppercase tracking-[0.2em] block mb-4">Uploading to VM Storage...</span>
                                            
                                            {/* Upload Progress Bar */}
                                            <div className="w-full bg-[#0d0d0d] h-1 rounded-full overflow-hidden mb-4">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#C5A059] to-[#E5C580] transition-all duration-300"
                                                    style={{ 
                                                        width: uploadMetrics.fileSize > 0 
                                                            ? `${(uploadMetrics.uploadedSize / uploadMetrics.fileSize) * 100}%` 
                                                            : '0%' 
                                                    }}
                                                />
                                            </div>

                                            {/* Upload Metrics */}
                                            <div className="space-y-2 text-left">
                                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                                    <span>File Name:</span>
                                                    <span className="text-white truncate ml-2 max-w-[200px]">{uploadMetrics.fileName}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                                    <span>Size:</span>
                                                    <span className="text-[#C5A059]">
                                                        {formatBytes(uploadMetrics.uploadedSize)} / {formatBytes(uploadMetrics.fileSize)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                                    <span>Progress:</span>
                                                    <span className="text-[#C5A059]">
                                                        {uploadMetrics.fileSize > 0 
                                                            ? `${Math.round((uploadMetrics.uploadedSize / uploadMetrics.fileSize) * 100)}%`
                                                            : '0%'
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                                                    <span>Elapsed Time:</span>
                                                    <span className="text-white">{formatTime(uploadMetrics.elapsedTime)}</span>
                                                </div>
                                            </div>

                                            <span className="text-[10px] text-gray-500 mt-4 block uppercase tracking-widest">Please wait, do not close this page</span>
                                        </div>
                                    ) : formData.demoFileName ? (
                                        <div className="text-[#C5A059]">
                                            <FileAudio className="mx-auto mb-4 animate-bounce" size={48} />
                                            <span className="font-['Montserrat'] text-sm uppercase tracking-[0.2em] block">{formData.demoFileName}</span>
                                            {formData.demoFileUrl && (
                                                <span className="text-[10px] text-gray-500 mt-2 block uppercase tracking-widest">Stored on VM</span>
                                            )}
                                            <span className="text-[10px] text-gray-500 mt-2 block uppercase tracking-widest">Click to change file</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <Upload className="mx-auto mb-4 group-hover:text-[#C5A059] transition-colors" size={48} />
                                            <span className="font-['Montserrat'] text-sm uppercase tracking-[0.2em] block group-hover:text-white transition-colors">Upload Demo Mix (MP4/MP3)</span>
                                            <span className="text-[10px] text-gray-600 mt-4 block uppercase tracking-[0.15em]">Video Limit: 10 Minutes | Max 80MB</span>
                                        </div>
                                    )}
                                </div>

                                {uploadSuccess && (
                                    <div className="bg-green-900/20 border-2 border-green-500/50 rounded p-4 flex items-center gap-3 animate-fade-in">
                                        <CheckCircle className="text-green-500 flex-shrink-0" size={24} />
                                        <div className="flex-1">
                                            <p className="text-green-400 text-sm font-['Montserrat'] uppercase tracking-[0.2em]">Upload Successful</p>
                                            <p className="text-green-500/70 text-[10px] uppercase tracking-[0.15em] mt-1">
                                                {formatBytes(uploadMetrics.fileSize)} uploaded in {formatTime(uploadMetrics.serverTime)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {uploadError && (
                                    <div className="bg-red-900/20 border-2 border-red-500/50 rounded p-4 flex items-center gap-3 animate-fade-in">
                                        <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                                        <div className="flex-1">
                                            <p className="text-red-400 text-sm font-['Montserrat'] uppercase tracking-[0.2em]">Upload Failed</p>
                                            <p className="text-red-500/70 text-[10px] uppercase tracking-[0.15em] mt-1">{uploadError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="group space-y-2">
                                    <label className="text-[10px] font-['Montserrat'] text-gray-500 uppercase tracking-[0.3em] group-focus-within:text-[#C5A059] transition-colors">Cloud Storage Link</label>
                                    <input name="cloudLink" value={formData.cloudLink} onChange={handleInputChange} type="text" className="w-full bg-[#0d0d0d] border border-white/10 px-4 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-all" placeholder="GDRIVE / DROPBOX / WETRANSFER" />
                                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Set link access to "Anyone with the link". Video limit: 10 minutes.</p>
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
                                        <div>
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Demo File</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-sm break-all">{formData.demoFileName || "PENDING"}</span>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="block font-['Montserrat'] text-[9px] text-gray-500 uppercase tracking-widest mb-1">Cloud Link</span>
                                            <span className="font-['Cinzel'] text-[#C5A059] text-sm break-all">{formData.cloudLink || "PENDING"}</span>
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

                    <div className="flex flex-row justify-between items-center gap-2 sm:gap-4 mt-8 sm:mt-14 pt-6 sm:pt-10 border-t border-white/5">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-['Montserrat'] flex items-center justify-center gap-1 sm:gap-2 transition-all hover:translate-x-[-4px] px-4 sm:px-6 py-3 sm:py-4 w-[48%] sm:w-auto sm:min-w-[180px] bg-[#C5A059] text-black shadow-[0_0_12px_rgba(197,160,89,0.35)] hover:bg-[#E5C580]"
                            >
                                <ChevronLeft size={14} /> BACK
                            </button>
                        ) : <div />}

                        <button
                            onClick={step < 4 ? handleNext : handleSubmit}
                            className="uppercase tracking-[0.3em] text-[9px] sm:text-[10px] font-['Montserrat'] flex items-center justify-center gap-1 sm:gap-2 transition-all hover:translate-x-[4px] px-4 sm:px-6 py-3 sm:py-4 w-[48%] sm:w-auto sm:min-w-[180px] bg-[#C5A059] text-black shadow-[0_0_12px_rgba(197,160,89,0.35)] hover:bg-[#E5C580]"
                        >
                            {step === 4 ? 'SUBMIT' : 'NEXT'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterView;
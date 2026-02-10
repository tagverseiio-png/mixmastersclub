import React, { useCallback, useEffect, useState } from 'react';

const ADMIN_TABS = [
    { id: 'home', label: 'Home' },
    { id: 'events', label: 'Events' },
    { id: 'judges', label: 'Judges' },
    { id: 'sponsors', label: 'Sponsors' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'registrations', label: 'Registrations' },
    { id: 'faq', label: 'FAQ' },
    { id: 'formats', label: 'Formats' },
    { id: 'results', label: 'Results' },
];

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const MAX_MEDIA_MB = 80;
const ALLOWED_MEDIA_TYPES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]);
const ALLOWED_POSTER_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
]);

const SectionShell = ({ title, children, onAdd }) => (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#080808] p-4 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-white/10 pb-4">
            <h3 className="font-['Cinzel'] text-xl md:text-2xl text-white">{title}</h3>
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="rounded-lg px-4 py-2 border border-[#C5A059] text-[#C5A059] text-[11px] uppercase tracking-[0.14em] hover:bg-[#C5A059] hover:text-black transition-colors"
                >
                    Add New
                </button>
            )}
        </div>
        {children}
    </div>
);

const FormInput = ({ label, className, ...props }) => (
    <div className={className}>
        {label && <label className="font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] text-gray-400">{label}</label>}
        <input
            {...props}
            className="mt-1.5 w-full rounded-lg bg-[#0f0f0f] border border-white/15 px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 outline-none transition-colors"
        />
    </div>
);

const FormSelect = ({ label, className, children, ...props }) => (
    <div className={className}>
        {label && <label className="font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] text-gray-400">{label}</label>}
        <select
            {...props}
            className="mt-1.5 w-full rounded-lg bg-[#0f0f0f] border border-white/15 px-3 py-2.5 text-white text-sm focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 outline-none transition-colors"
        >
            {children}
        </select>
    </div>
);

const FormTextarea = ({ label, className, ...props }) => (
    <div className={className}>
        {label && <label className="font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] text-gray-400">{label}</label>}
        <textarea
            {...props}
            className="mt-1.5 w-full rounded-lg bg-[#0f0f0f] border border-white/15 px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 outline-none transition-colors"
        />
    </div>
);

const buildApiRoot = (apiBase) => {
    const normalized = (apiBase || '').replace(/\/$/, '');
    if (!normalized) return '';
    return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};
const isVideoUrl = (value = '') => /\.(mp4|webm|mov)(\?|#|$)/i.test(String(value).trim());

const AdminView = ({ onExit, apiBase, adminToken, onContentSaved }) => {
    const [activeTab, setActiveTab] = useState('home');
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [events, setEvents] = useState([]);
    const [judges, setJudges] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [gallery, setGallery] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [faq, setFaq] = useState([]);
    const [formats, setFormats] = useState([]);
    const [results, setResults] = useState({
        heading: '',
        subtitle: '',
        items: [],
    });
    const [homeSettings, setHomeSettings] = useState({
        heroVideoUrl: '',
        heroPosterUrl: '',
        visionImageUrl: '',
        aboutMediaType: 'video',
        aboutMediaUrl: '',
        aboutPosterUrl: '',
        visionTitle: '',
        visionSubtitle: '',
        visionQuote: '',
        visionBody: '',
    });

    const apiRoot = buildApiRoot(apiBase);
    const hasBackendConnection = Boolean(apiRoot && adminToken);
    const toDateInputValue = (value) => {
        if (!value) return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const parsed = Date.parse(value);
        if (Number.isNaN(parsed)) return '';
        return new Date(parsed).toISOString().slice(0, 10);
    };

    const setMainEvent = (localId) => {
        setEvents((prev) => prev.map((item) => ({ ...item, isMainEvent: item._localId === localId })));
    };

    const withLocalId = (list = []) => list.map((item) => ({ ...item, _localId: createId() }));

    const hydrateFromBackend = useCallback((content) => {
        const backendSettings = content?.settings && typeof content.settings === 'object'
            ? content.settings
            : { heroVideoUrl: '', heroPosterUrl: '' };
        setHomeSettings({
            heroVideoUrl: backendSettings.heroVideoUrl || '',
            heroPosterUrl: backendSettings.heroPosterUrl || '',
            visionImageUrl: backendSettings.visionImageUrl || '',
            aboutMediaType: backendSettings.aboutMediaType === 'image' ? 'image' : 'video',
            aboutMediaUrl: backendSettings.aboutMediaUrl || '',
            aboutPosterUrl: backendSettings.aboutPosterUrl || '',
            visionTitle: backendSettings.visionTitle || '',
            visionSubtitle: backendSettings.visionSubtitle || '',
            visionQuote: backendSettings.visionQuote || '',
            visionBody: backendSettings.visionBody || '',
        });

        const nextEvents = Array.isArray(content?.events) ? content.events : [];
        const normalizedEvents = nextEvents.length > 0
            ? nextEvents
            : [];
        setEvents(withLocalId(normalizedEvents));
        setJudges(withLocalId(Array.isArray(content?.judges) ? content.judges : []));
        setSponsors(withLocalId(Array.isArray(content?.sponsors) ? content.sponsors : []));
        setGallery(withLocalId(Array.isArray(content?.gallery) ? content.gallery : []));
        setFaq(withLocalId(Array.isArray(content?.faq) ? content.faq : []));
        setFormats(
            withLocalId(
                Array.isArray(content?.formats)
                    ? content.formats.map((item) => ({ title: item.title || '', desc: item.desc || '' }))
                    : []
            )
        );
        const backendResults = content?.results && typeof content.results === 'object'
            ? content.results
            : { heading: '', subtitle: '', items: [] };
        setResults({
            heading: backendResults.heading || '',
            subtitle: backendResults.subtitle || '',
            items: withLocalId(Array.isArray(backendResults.items) ? backendResults.items : []),
        });
    }, []);

    useEffect(() => {
        if (!hasBackendConnection) return;
        let cancelled = false;

        const loadContent = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${apiRoot}/content`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${adminToken}`,
                    },
                    cache: 'no-store',
                });
                if (!response.ok) {
                    throw new Error('Unable to load content');
                }
                const payload = await response.json();
                if (!cancelled) {
                    hydrateFromBackend(payload);
                }
            } catch {
                if (!cancelled) {
                    setNotice('Failed to load backend content');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadContent();
        return () => {
            cancelled = true;
        };
    }, [hasBackendConnection, apiRoot, adminToken, hydrateFromBackend]);

    const loadRegistrations = useCallback(async () => {
        if (!hasBackendConnection) return;
        setIsLoadingRegistrations(true);
        try {
            const response = await fetch(`${apiRoot}/registrations`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${adminToken}`,
                },
                cache: 'no-store',
            });
            if (!response.ok) throw new Error('Failed to load registrations');
            const payload = await response.json();
            setRegistrations(Array.isArray(payload) ? payload : []);
        } catch {
            showNotice('Failed to load registrations');
        } finally {
            setIsLoadingRegistrations(false);
        }
    }, [hasBackendConnection, apiRoot, adminToken]);

    useEffect(() => {
        loadRegistrations();
    }, [loadRegistrations]);

    const showNotice = (text) => {
        setNotice(text);
        setTimeout(() => setNotice(''), 2500);
    };

    const deleteRegistration = async (id) => {
        if (!id || !hasBackendConnection) return;
        try {
            const response = await fetch(`${apiRoot}/registrations/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${adminToken}` },
            });
            if (!response.ok) throw new Error('Delete failed');
            setRegistrations((prev) => prev.filter((item) => String(item.id) !== String(id)));
            showNotice('Registration deleted');
        } catch {
            showNotice('Failed to delete registration');
        }
    };

    const uploadMediaFile = async (file) => {
        if (!file) return '';
        const formData = new FormData();
        formData.append('media', file);
        const response = await fetch(`${apiRoot}/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${adminToken}`,
            },
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        const payload = await response.json();
        return payload?.url || payload?.path || '';
    };

    const buildPersistPayload = async () => {
        const nextSettings = {
            heroVideoUrl: homeSettings.heroVideoFile instanceof File
                ? await uploadMediaFile(homeSettings.heroVideoFile)
                : (homeSettings.heroVideoUrl || '').trim(),
            heroPosterUrl: homeSettings.heroPosterFile instanceof File
                ? await uploadMediaFile(homeSettings.heroPosterFile)
                : (homeSettings.heroPosterUrl || '').trim(),
            visionImageUrl: homeSettings.visionImageFile instanceof File
                ? await uploadMediaFile(homeSettings.visionImageFile)
                : (homeSettings.visionImageUrl || '').trim(),
            aboutMediaType: homeSettings.aboutMediaType === 'image' ? 'image' : 'video',
            aboutMediaUrl: homeSettings.aboutMediaFile instanceof File
                ? await uploadMediaFile(homeSettings.aboutMediaFile)
                : (homeSettings.aboutMediaUrl || '').trim(),
            aboutPosterUrl: homeSettings.aboutPosterFile instanceof File
                ? await uploadMediaFile(homeSettings.aboutPosterFile)
                : (homeSettings.aboutPosterUrl || '').trim(),
            visionTitle: (homeSettings.visionTitle || '').trim(),
            visionSubtitle: (homeSettings.visionSubtitle || '').trim(),
            visionQuote: (homeSettings.visionQuote || '').trim(),
            visionBody: (homeSettings.visionBody || '').trim(),
        };

        const nextEvents = await Promise.all(
            events.map(async (item) => {
                const mediaUrl = item.mediaFile instanceof File ? await uploadMediaFile(item.mediaFile) : (item.mediaUrl || '');
                const posterUrl = item.posterFile instanceof File ? await uploadMediaFile(item.posterFile) : (item.posterUrl || '');
                return {
                    id: item.id || createId(),
                    slug: item.slug || '',
                    title: item.title || '',
                    date: item.date || '',
                    location: item.location || '',
                    status: item.status || 'Upcoming',
                    mediaType: item.mediaType || 'image',
                    mediaUrl,
                    posterUrl,
                    image: item.mediaType === 'image' ? mediaUrl : (item.image || posterUrl || ''),
                    isMainEvent: Boolean(item.isMainEvent),
                    description: item.description || '',
                    price: item.price || '',
                };
            })
        );

        const nextJudges = await Promise.all(
            judges.map(async (item) => {
                const mediaUrl = item.mediaFile instanceof File ? await uploadMediaFile(item.mediaFile) : (item.mediaUrl || item.image || '');
                return {
                    id: item.id || createId(),
                    name: item.name || '',
                    title: item.title || '',
                    country: item.country || '',
                    mediaType: item.mediaType || 'image',
                    mediaUrl,
                    image: mediaUrl,
                    quote: item.quote || '',
                };
            })
        );

        const nextGallery = await Promise.all(
            gallery.map(async (item) => ({
                type: item.type || 'image',
                url: item.mediaFile instanceof File ? await uploadMediaFile(item.mediaFile) : (item.url || ''),
                poster: item.posterFile instanceof File ? await uploadMediaFile(item.posterFile) : (item.poster || ''),
                instagramUrl: item.instagramUrl || '',
            }))
        );

        return {
            settings: nextSettings,
            events: nextEvents,
            judges: nextJudges,
            sponsors: sponsors.map((item) => ({ name: item.name || '', role: item.role || '' })),
            gallery: nextGallery,
            faq: faq.map((item) => ({ q: item.q || '', a: item.a || '' })),
            formats: formats.map((item) => ({ title: item.title || '', desc: item.desc || '' })),
            results: {
                heading: results.heading || '',
                subtitle: results.subtitle || '',
                items: results.items.map((item) => ({
                    title: item.title || '',
                    winner: item.winner || '',
                    country: item.country || '',
                })),
            },
        };
    };

    const saveToBackend = async () => {
        if (!hasBackendConnection) {
            showNotice('Backend not connected');
            return;
        }
        setIsSaving(true);
        try {
            const payload = await buildPersistPayload();
            const response = await fetch(`${apiRoot}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error('Save failed');
            }
            const next = await response.json();
            hydrateFromBackend(next?.content || payload);
            onContentSaved?.(next?.content || payload);
            if (!next?.content?.settings) {
                showNotice('Saved, but backend restart required for Home Hero settings.');
            } else {
                showNotice('Saved to backend');
            }
        } catch {
            showNotice('Save failed. Check backend and token.');
        } finally {
            setIsSaving(false);
        }
    };

    const makeObjectUrl = (existingUrl, file) => {
        if (existingUrl && existingUrl.startsWith('blob:')) {
            URL.revokeObjectURL(existingUrl);
        }
        return URL.createObjectURL(file);
    };

    const validateUpload = (file, { posterOnly = false } = {}) => {
        if (!file) return { ok: false, message: 'No file selected' };
        const maxBytes = MAX_MEDIA_MB * 1024 * 1024;
        if (file.size > maxBytes) {
            return { ok: false, message: `File too large. Max ${MAX_MEDIA_MB}MB.` };
        }

        const allowedSet = posterOnly ? ALLOWED_POSTER_TYPES : ALLOWED_MEDIA_TYPES;
        if (!allowedSet.has(file.type)) {
            return { ok: false, message: `Unsupported file type: ${file.type || 'unknown'}` };
        }
        return { ok: true };
    };

    const handleHomeMediaUpload = (file, target = 'hero') => {
        if (!file) return;
        const validation = validateUpload(file, { posterOnly: target === 'poster' || target === 'about-poster' });
        if (!validation.ok) {
            showNotice(validation.message);
            return;
        }

        setHomeSettings((prev) => {
            if (target === 'vision-image') {
                return {
                    ...prev,
                    visionImageUrl: makeObjectUrl(prev.visionImageUrl, file),
                    visionImageFileName: file.name,
                    visionImageFile: file,
                };
            }
            if (target === 'poster') {
                return {
                    ...prev,
                    heroPosterUrl: makeObjectUrl(prev.heroPosterUrl, file),
                    heroPosterFileName: file.name,
                    heroPosterFile: file,
                };
            }
            if (target === 'about-media') {
                return {
                    ...prev,
                    aboutMediaUrl: makeObjectUrl(prev.aboutMediaUrl, file),
                    aboutMediaFileName: file.name,
                    aboutMediaFile: file,
                    aboutMediaType: file.type.startsWith('image/') ? 'image' : 'video',
                };
            }
            if (target === 'about-poster') {
                return {
                    ...prev,
                    aboutPosterUrl: makeObjectUrl(prev.aboutPosterUrl, file),
                    aboutPosterFileName: file.name,
                    aboutPosterFile: file,
                };
            }
            return {
                ...prev,
                heroVideoUrl: makeObjectUrl(prev.heroVideoUrl, file),
                heroVideoFileName: file.name,
                heroVideoFile: file,
            };
        });
    };

    const handleEventMediaUpload = (localId, file, target = 'media') => {
        if (!file) return;
        const validation = validateUpload(file, { posterOnly: target === 'poster' });
        if (!validation.ok) {
            showNotice(validation.message);
            return;
        }
        setEvents((prev) =>
            prev.map((item) => {
                if (item._localId !== localId) return item;
                if (target === 'poster') {
                    return {
                        ...item,
                        posterUrl: makeObjectUrl(item.posterUrl, file),
                        posterFileName: file.name,
                        posterFile: file,
                    };
                }
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                const mediaUrl = makeObjectUrl(item.mediaUrl, file);
                return {
                    ...item,
                    mediaType,
                    mediaUrl,
                    image: mediaType === 'image' ? mediaUrl : item.image,
                    mediaFileName: file.name,
                    mediaFile: file,
                };
            })
        );
    };

    const handleJudgeMediaUpload = (localId, file) => {
        if (!file) return;
        const validation = validateUpload(file, { posterOnly: false });
        if (!validation.ok) {
            showNotice(validation.message);
            return;
        }
        setJudges((prev) =>
            prev.map((item) => {
                if (item._localId !== localId) return item;
                const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                const mediaUrl = makeObjectUrl(item.mediaUrl, file);
                return {
                    ...item,
                    mediaType,
                    mediaUrl,
                    image: mediaUrl,
                    mediaFileName: file.name,
                    mediaFile: file,
                };
            })
        );
    };

    const handleGalleryMediaUpload = (localId, file, target = 'media') => {
        if (!file) return;
        const validation = validateUpload(file, { posterOnly: target === 'poster' });
        if (!validation.ok) {
            showNotice(validation.message);
            return;
        }
        setGallery((prev) =>
            prev.map((item) => {
                if (item._localId !== localId) return item;
                if (target === 'poster') {
                    return {
                        ...item,
                        poster: makeObjectUrl(item.poster, file),
                        posterFileName: file.name,
                        posterFile: file,
                    };
                }
                return {
                    ...item,
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: makeObjectUrl(item.url, file),
                    mediaFileName: file.name,
                    mediaFile: file,
                };
            })
        );
    };

    const inputClass =
        'w-full rounded-lg bg-[#0f0f0f] border border-white/15 px-3 py-2.5 text-white text-sm placeholder:text-gray-600 focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/25 outline-none transition-colors';
    const labelClass = "font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] text-gray-400";
    const activeTabLabel = ADMIN_TABS.find((tab) => tab.id === activeTab)?.label || 'Home';

    return (
        <div className="pt-24 md:pt-32 pb-12 md:pb-20 min-h-screen bg-[#050505]">
            <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
                <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#111111] to-[#090909] p-5 md:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="font-['Cinzel'] text-3xl md:text-5xl text-white mb-2">Admin Panel</h1>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <span className={`font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 rounded-full border ${hasBackendConnection ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                                    {hasBackendConnection ? 'Backend Connected' : 'Backend Disconnected'}
                                </span>
                                <span className="font-['Montserrat'] text-[10px] uppercase tracking-[0.16em] text-gray-500">
                                    Active: {activeTabLabel}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={saveToBackend}
                                disabled={!hasBackendConnection || isSaving}
                                className="rounded-lg px-4 py-2.5 border border-[#C5A059] text-[#C5A059] text-[11px] uppercase tracking-[0.12em] hover:bg-[#C5A059] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Saving...' : 'Save to Backend'}
                            </button>
                            <button
                                onClick={onExit}
                                className="rounded-lg px-4 py-2.5 border border-white/20 text-white text-[11px] uppercase tracking-[0.12em] hover:border-white transition-colors"
                            >
                                Exit Admin
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="font-['Montserrat'] text-[10px] uppercase tracking-[0.14em] text-gray-500">
                            Upload support: mp4, webm, mov, jpg, png, webp, avif | max {MAX_MEDIA_MB}MB
                        </p>
                    </div>
                </div>

                {notice && (
                    <div className="mb-6 rounded-lg border border-[#C5A059]/40 bg-[#0a0a0a] px-4 py-3 text-xs text-[#C5A059] uppercase tracking-[0.12em]">
                        {notice}
                    </div>
                )}
                {isLoading && (
                    <div className="mb-6 rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3 text-xs text-gray-300 uppercase tracking-[0.12em]">
                        Loading content from backend...
                    </div>
                )}

                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="inline-flex min-w-full md:min-w-0 gap-2 border border-white/10 rounded-xl bg-[#090909] p-2">
                    {ADMIN_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors border ${activeTab === tab.id ? 'text-[#C5A059] border-[#C5A059]/50 bg-[#15120a]' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    </div>
                </div>

                {activeTab === 'home' && (
                    <SectionShell title="Home Hero">
                        <div className="bg-[#0a0a0a] border border-white/10 p-4 grid md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Hero Video Upload</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    className={inputClass}
                                    onChange={(e) => handleHomeMediaUpload(e.target.files?.[0], 'hero')}
                                />
                                {homeSettings.heroVideoFileName && (
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{homeSettings.heroVideoFileName}</p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Hero Poster Upload (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={inputClass}
                                    onChange={(e) => handleHomeMediaUpload(e.target.files?.[0], 'poster')}
                                />
                                {homeSettings.heroPosterFileName && (
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{homeSettings.heroPosterFileName}</p>
                                )}
                            </div>
                            <FormInput
                                label="Hero Video URL (Direct MP4/WebM)"
                                value={homeSettings.heroVideoUrl || ''}
                                placeholder="https://.../video.mp4"
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, heroVideoUrl: e.target.value, heroVideoFile: null, heroVideoFileName: '' }))}
                            />
                            <FormInput
                                label="Hero Poster URL (Optional)"
                                value={homeSettings.heroPosterUrl || ''}
                                placeholder="https://..."
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, heroPosterUrl: e.target.value, heroPosterFile: null, heroPosterFileName: '' }))}
                            />
                            <div>
                                <label className={labelClass}>Vision Image Upload (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={inputClass}
                                    onChange={(e) => handleHomeMediaUpload(e.target.files?.[0], 'vision-image')}
                                />
                                {homeSettings.visionImageFileName && (
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{homeSettings.visionImageFileName}</p>
                                )}
                            </div>
                            <FormInput
                                label="Vision Image URL (Optional)"
                                value={homeSettings.visionImageUrl || ''}
                                placeholder="https://.../image.jpg"
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, visionImageUrl: e.target.value, visionImageFile: null, visionImageFileName: '' }))}
                            />
                            <FormSelect
                                label="About Media Type"
                                value={homeSettings.aboutMediaType || 'video'}
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, aboutMediaType: e.target.value }))}
                            >
                                <option value="video">Video</option>
                                <option value="image">Image</option>
                            </FormSelect>
                            <div>
                                <label className={labelClass}>About Media Upload (Image or Video)</label>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    className={inputClass}
                                    onChange={(e) => handleHomeMediaUpload(e.target.files?.[0], 'about-media')}
                                />
                                {homeSettings.aboutMediaFileName && (
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{homeSettings.aboutMediaFileName}</p>
                                )}
                            </div>
                            <FormInput
                                label="About Media URL"
                                value={homeSettings.aboutMediaUrl || ''}
                                placeholder="https://.../about-media.mp4"
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, aboutMediaUrl: e.target.value, aboutMediaFile: null, aboutMediaFileName: '' }))}
                            />
                            <div>
                                <label className={labelClass}>About Poster Upload (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className={inputClass}
                                    onChange={(e) => handleHomeMediaUpload(e.target.files?.[0], 'about-poster')}
                                />
                                {homeSettings.aboutPosterFileName && (
                                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{homeSettings.aboutPosterFileName}</p>
                                )}
                            </div>
                            <FormInput
                                label="About Poster URL (Optional)"
                                value={homeSettings.aboutPosterUrl || ''}
                                placeholder="https://.../about-poster.jpg"
                                onChange={(e) => setHomeSettings((prev) => ({ ...prev, aboutPosterUrl: e.target.value, aboutPosterFile: null, aboutPosterFileName: '' }))}
                            />
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'events' && (
                    <SectionShell
                        title="Events"
                        onAdd={() =>
                            setEvents((prev) => [
                                ...prev,
                                {
                                    _localId: createId(),
                                    id: prev.length + 1,
                                    slug: '',
                                    title: '',
                                    date: '',
                                    location: '',
                                    status: 'Upcoming',
                                    mediaType: 'image',
                                    mediaUrl: '',
                                    posterUrl: '',
                                    image: '',
                                    isMainEvent: prev.length === 0,
                                    description: '',
                                    price: '',
                                },
                            ])
                        }
                    >
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event._localId} className="bg-[#0a0a0a] border border-white/10 p-4 grid md:grid-cols-4 gap-3">
                                    <FormInput
                                        label="Event Title"
                                        value={event.title}
                                        placeholder="Title"
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, title: e.target.value } : item)))}
                                    />
                                    <FormInput
                                        label="Slug"
                                        value={event.slug}
                                        placeholder="Slug"
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, slug: e.target.value } : item)))}
                                    />
                                    <FormInput
                                        label="Date"
                                        type="date"
                                        value={toDateInputValue(event.date)}
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, date: e.target.value } : item)))}
                                    />
                                    <FormInput
                                        label="Location"
                                        value={event.location}
                                        placeholder="Location"
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, location: e.target.value } : item)))}
                                    />
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Media Upload (Image or Video)</label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className={inputClass}
                                            onChange={(e) => handleEventMediaUpload(event._localId, e.target.files?.[0], 'media')}
                                        />
                                        {event.mediaFileName && (
                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{event.mediaFileName}</p>
                                        )}
                                    </div>
                                    <FormInput
                                        className="md:col-span-2"
                                        label="Media URL (Image or Video)"
                                        value={event.mediaUrl || ''}
                                        placeholder="https://.../event-media.mp4"
                                        onChange={(e) =>
                                            setEvents((prev) =>
                                                prev.map((item) =>
                                                    item._localId === event._localId
                                                        ? {
                                                            ...item,
                                                            mediaUrl: e.target.value,
                                                            mediaFile: null,
                                                            mediaFileName: '',
                                                            mediaType: isVideoUrl(e.target.value) ? 'video' : 'image',
                                                            image: isVideoUrl(e.target.value) ? item.image : e.target.value,
                                                        }
                                                        : item
                                                )
                                            )
                                        }
                                    />
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Poster Upload (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className={inputClass}
                                            onChange={(e) => handleEventMediaUpload(event._localId, e.target.files?.[0], 'poster')}
                                        />
                                        {event.posterFileName && (
                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{event.posterFileName}</p>
                                        )}
                                    </div>
                                    <FormInput
                                        className="md:col-span-2"
                                        label="Poster URL (Optional)"
                                        value={event.posterUrl || ''}
                                        placeholder="https://.../event-poster.jpg"
                                        onChange={(e) =>
                                            setEvents((prev) =>
                                                prev.map((item) =>
                                                    item._localId === event._localId
                                                        ? { ...item, posterUrl: e.target.value, posterFile: null, posterFileName: '' }
                                                        : item
                                                )
                                            )
                                        }
                                    />
                                    <FormSelect
                                        label="Status"
                                        value={event.status}
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, status: e.target.value } : item)))}
                                    >
                                        <option value="Upcoming">Upcoming</option>
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                    </FormSelect>
                                    <FormInput
                                        label="Price / Prize"
                                        value={event.price}
                                        placeholder="Price/Prize"
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, price: e.target.value } : item)))}
                                    />
                                    <div className="md:col-span-2 flex items-center gap-3 border border-white/10 px-3 py-2">
                                        <input
                                            id={`main-${event._localId}`}
                                            type="radio"
                                            name="mainEvent"
                                            checked={Boolean(event.isMainEvent)}
                                            onChange={() => setMainEvent(event._localId)}
                                            className="accent-[#C5A059]"
                                        />
                                        <label htmlFor={`main-${event._localId}`} className="text-xs uppercase tracking-[0.12em] text-gray-300">
                                            Main Event (only one)
                                        </label>
                                    </div>
                                    <FormTextarea
                                        className="md:col-span-4"
                                        label="Description"
                                        value={event.description}
                                        rows={3}
                                        placeholder="Description"
                                        onChange={(e) => setEvents((prev) => prev.map((item) => (item._localId === event._localId ? { ...item, description: e.target.value } : item)))}
                                    />
                                    <div className="md:col-span-4">
                                        <button
                                            onClick={() =>
                                                setEvents((prev) => {
                                                    const next = prev.filter((item) => item._localId !== event._localId);
                                                    if (next.length > 0 && !next.some((item) => item.isMainEvent)) {
                                                        next[0] = { ...next[0], isMainEvent: true };
                                                    }
                                                    return next;
                                                })
                                            }
                                            className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300"
                                        >
                                            Remove Event
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'judges' && (
                    <SectionShell
                        title="Judges"
                        onAdd={() =>
                            setJudges((prev) => [
                                ...prev,
                                { _localId: createId(), id: prev.length + 1, name: '', title: '', country: '', mediaType: 'image', mediaUrl: '', image: '', quote: '' },
                            ])
                        }
                    >
                        <div className="space-y-4">
                            {judges.map((judge) => (
                                <div key={judge._localId} className="bg-[#0a0a0a] border border-white/10 p-4 grid md:grid-cols-3 gap-3">
                                    <input className={inputClass} value={judge.name} placeholder="Name" onChange={(e) => setJudges((prev) => prev.map((item) => (item._localId === judge._localId ? { ...item, name: e.target.value } : item)))} />
                                    <input className={inputClass} value={judge.title} placeholder="Title" onChange={(e) => setJudges((prev) => prev.map((item) => (item._localId === judge._localId ? { ...item, title: e.target.value } : item)))} />
                                    <input className={inputClass} value={judge.country} placeholder="Country" onChange={(e) => setJudges((prev) => prev.map((item) => (item._localId === judge._localId ? { ...item, country: e.target.value } : item)))} />
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Media Upload (Image or Video)</label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className={inputClass}
                                            onChange={(e) => handleJudgeMediaUpload(judge._localId, e.target.files?.[0])}
                                        />
                                        {judge.mediaFileName && (
                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{judge.mediaFileName}</p>
                                        )}
                                    </div>
                                    <FormInput
                                        className="md:col-span-2"
                                        label="Media URL (Image or Video)"
                                        value={judge.mediaUrl || ''}
                                        placeholder="https://.../judge-media.mp4"
                                        onChange={(e) =>
                                            setJudges((prev) =>
                                                prev.map((item) =>
                                                    item._localId === judge._localId
                                                        ? {
                                                            ...item,
                                                            mediaUrl: e.target.value,
                                                            image: e.target.value,
                                                            mediaType: isVideoUrl(e.target.value) ? 'video' : 'image',
                                                            mediaFile: null,
                                                            mediaFileName: '',
                                                        }
                                                        : item
                                                )
                                            )
                                        }
                                    />
                                    <select className={inputClass} value={judge.mediaType || 'image'} onChange={(e) => setJudges((prev) => prev.map((item) => (item._localId === judge._localId ? { ...item, mediaType: e.target.value } : item)))}>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                    <textarea className={`md:col-span-3 ${inputClass}`} value={judge.quote} rows={2} placeholder="Quote" onChange={(e) => setJudges((prev) => prev.map((item) => (item._localId === judge._localId ? { ...item, quote: e.target.value } : item)))} />
                                    <button onClick={() => setJudges((prev) => prev.filter((item) => item._localId !== judge._localId))} className="md:col-span-3 text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300 text-left">
                                        Remove Judge
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'sponsors' && (
                    <SectionShell
                        title="Sponsors"
                        onAdd={() => setSponsors((prev) => [...prev, { _localId: createId(), name: '', role: '' }])}
                    >
                        <div className="space-y-3">
                            {sponsors.map((sponsor) => (
                                <div key={sponsor._localId} className="bg-[#0a0a0a] border border-white/10 p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                                    <input className={inputClass} value={sponsor.name} placeholder="Sponsor name" onChange={(e) => setSponsors((prev) => prev.map((item) => (item._localId === sponsor._localId ? { ...item, name: e.target.value } : item)))} />
                                    <input className={inputClass} value={sponsor.role} placeholder="Role" onChange={(e) => setSponsors((prev) => prev.map((item) => (item._localId === sponsor._localId ? { ...item, role: e.target.value } : item)))} />
                                    <button onClick={() => setSponsors((prev) => prev.filter((item) => item._localId !== sponsor._localId))} className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300 text-left md:text-right">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'gallery' && (
                    <SectionShell
                        title="Gallery"
                        onAdd={() => setGallery((prev) => [...prev, { _localId: createId(), type: 'video', url: '', poster: '', instagramUrl: '' }])}
                    >
                        <div className="space-y-3">
                            {gallery.map((item) => (
                                <div key={item._localId} className="bg-[#0a0a0a] border border-white/10 p-4 grid md:grid-cols-[120px_1fr_1fr] gap-3">
                                    <select className={inputClass} value={item.type} onChange={(e) => setGallery((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, type: e.target.value } : entry)))}>
                                        <option value="video">Video</option>
                                        <option value="image">Image</option>
                                    </select>
                                    <div>
                                        <label className={labelClass}>Media Upload</label>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className={inputClass}
                                            onChange={(e) => handleGalleryMediaUpload(item._localId, e.target.files?.[0], 'media')}
                                        />
                                        {item.mediaFileName && (
                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{item.mediaFileName}</p>
                                        )}
                                    </div>
                                    <FormInput
                                        label="Media URL"
                                        value={item.url || ''}
                                        placeholder="https://.../gallery-media.mp4"
                                        onChange={(e) =>
                                            setGallery((prev) =>
                                                prev.map((entry) =>
                                                    entry._localId === item._localId
                                                        ? {
                                                            ...entry,
                                                            url: e.target.value,
                                                            type: isVideoUrl(e.target.value) ? 'video' : 'image',
                                                            mediaFile: null,
                                                            mediaFileName: '',
                                                        }
                                                        : entry
                                                )
                                            )
                                        }
                                    />
                                    <div>
                                        <label className={labelClass}>Poster Upload (Optional)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className={inputClass}
                                            onChange={(e) => handleGalleryMediaUpload(item._localId, e.target.files?.[0], 'poster')}
                                        />
                                        {item.posterFileName && (
                                            <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#C5A059]">{item.posterFileName}</p>
                                        )}
                                    </div>
                                    <FormInput
                                        label="Poster URL (Optional)"
                                        value={item.poster || ''}
                                        placeholder="https://.../gallery-poster.jpg"
                                        onChange={(e) =>
                                            setGallery((prev) =>
                                                prev.map((entry) =>
                                                    entry._localId === item._localId
                                                        ? { ...entry, poster: e.target.value, posterFile: null, posterFileName: '' }
                                                        : entry
                                                )
                                            )
                                        }
                                    />
                                    <FormInput
                                        className="md:col-span-2"
                                        label="Instagram Link (Optional)"
                                        value={item.instagramUrl || ''}
                                        placeholder="https://instagram.com/..."
                                        onChange={(e) => setGallery((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, instagramUrl: e.target.value } : entry)))}
                                    />
                                    <button onClick={() => setGallery((prev) => prev.filter((entry) => entry._localId !== item._localId))} className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'registrations' && (
                    <SectionShell title="Registration Inbox">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
                            <div className="hidden md:grid grid-cols-[170px_110px_1fr_1fr_120px_100px] gap-3 px-4 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.14em] text-gray-500">
                                <span>Submitted</span>
                                <span>Role</span>
                                <span>Name</span>
                                <span>Event</span>
                                <span>Email</span>
                                <span>Action</span>
                            </div>

                            {isLoadingRegistrations && (
                                <div className="px-4 py-5 text-xs uppercase tracking-[0.12em] text-gray-400">
                                    Loading registrations...
                                </div>
                            )}

                            {!isLoadingRegistrations && registrations.length === 0 && (
                                <div className="px-4 py-5 text-xs uppercase tracking-[0.12em] text-gray-500">
                                    No registrations yet.
                                </div>
                            )}

                            <div className="divide-y divide-white/10">
                                {registrations.map((row) => (
                                    <details key={row.id} className="group">
                                        <summary className="list-none cursor-pointer px-4 py-3 hover:bg-white/5 transition-colors">
                                            <div className="hidden md:grid grid-cols-[170px_110px_1fr_1fr_120px_100px] gap-3 items-center">
                                                <span className="text-xs text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</span>
                                                <span className="text-xs uppercase tracking-[0.12em] text-[#C5A059]">{row.role || '-'}</span>
                                                <span className="text-sm text-white truncate">{row.fullName || '-'}</span>
                                                <span className="text-sm text-gray-300 truncate">{row.eventTitle || '-'}</span>
                                                <span className="text-xs text-gray-400 truncate">{row.email || '-'}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        deleteRegistration(row.id);
                                                    }}
                                                    className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300"
                                                >
                                                    Delete
                                                </button>
                                            </div>

                                            <div className="md:hidden space-y-1">
                                                <p className="text-xs text-gray-400">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</p>
                                                <p className="text-sm text-white">{row.fullName || '-'}</p>
                                                <p className="text-xs uppercase tracking-[0.12em] text-[#C5A059]">{row.role || '-'}</p>
                                                <p className="text-xs text-gray-400">{row.eventTitle || '-'}</p>
                                            </div>
                                        </summary>

                                        <div className="px-4 pb-4 text-sm text-gray-300 space-y-2">
                                            <div className="grid md:grid-cols-2 gap-2">
                                                <p><span className="text-gray-500">Email:</span> {row.email || '-'}</p>
                                                <p><span className="text-gray-500">City:</span> {row.city || '-'}</p>
                                                <p><span className="text-gray-500">Nationality:</span> {row.nationality || '-'}</p>
                                                <p><span className="text-gray-500">Age:</span> {row.age || '-'}</p>
                                                <p><span className="text-gray-500">Stage Name:</span> {row.stageName || '-'}</p>
                                                <p><span className="text-gray-500">Experience:</span> {row.experience || '-'}</p>
                                                <p className="md:col-span-2"><span className="text-gray-500">Instagram:</span> {row.instagram || '-'}</p>
                                                <p className="md:col-span-2"><span className="text-gray-500">SoundCloud/Mixcloud:</span> {row.soundCloud || '-'}</p>
                                                <p className="md:col-span-2"><span className="text-gray-500">Demo File:</span> {row.demoFile || '-'}</p>
                                                <p className="md:col-span-2"><span className="text-gray-500">Event:</span> {row.eventTitle || '-'} {row.eventDate ? `• ${row.eventDate}` : ''} {row.eventLocation ? `• ${row.eventLocation}` : ''}</p>
                                            </div>
                                            <div className="md:hidden pt-2">
                                                <button
                                                    onClick={() => deleteRegistration(row.id)}
                                                    className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300"
                                                >
                                                    Delete Registration
                                                </button>
                                            </div>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'faq' && (
                    <SectionShell
                        title="FAQ"
                        onAdd={() => setFaq((prev) => [...prev, { _localId: createId(), q: '', a: '' }])}
                    >
                        <div className="space-y-3">
                            {faq.map((item) => (
                                <div key={item._localId} className="bg-[#0a0a0a] border border-white/10 p-4 space-y-3">
                                    <div>
                                        <label className={labelClass}>Question</label>
                                        <input className={inputClass} value={item.q} onChange={(e) => setFaq((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, q: e.target.value } : entry)))} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Answer</label>
                                        <textarea className={inputClass} rows={3} value={item.a} onChange={(e) => setFaq((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, a: e.target.value } : entry)))} />
                                    </div>
                                    <button onClick={() => setFaq((prev) => prev.filter((entry) => entry._localId !== item._localId))} className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'formats' && (
                    <SectionShell
                        title="Formats"
                        onAdd={() => setFormats((prev) => [...prev, { _localId: createId(), title: '', desc: '' }])}
                    >
                        <div className="space-y-3">
                            {formats.map((item) => (
                                <div key={item._localId} className="bg-[#0a0a0a] border border-white/10 p-4 grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start">
                                    <input className={inputClass} value={item.title} placeholder="Title" onChange={(e) => setFormats((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, title: e.target.value } : entry)))} />
                                    <textarea className={inputClass} rows={2} value={item.desc} placeholder="Description" onChange={(e) => setFormats((prev) => prev.map((entry) => (entry._localId === item._localId ? { ...entry, desc: e.target.value } : entry)))} />
                                    <button onClick={() => setFormats((prev) => prev.filter((entry) => entry._localId !== item._localId))} className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionShell>
                )}

                {activeTab === 'results' && (
                    <SectionShell
                        title="Results"
                        onAdd={() => setResults((prev) => ({ ...prev, items: [...prev.items, { _localId: createId(), title: '', winner: '', country: '' }] }))}
                    >
                        <div className="bg-[#0a0a0a] border border-white/10 p-4 space-y-4">
                            <div className="grid md:grid-cols-2 gap-3">
                                <input className={inputClass} value={results.heading} placeholder="Heading" onChange={(e) => setResults((prev) => ({ ...prev, heading: e.target.value }))} />
                                <input className={inputClass} value={results.subtitle} placeholder="Subtitle" onChange={(e) => setResults((prev) => ({ ...prev, subtitle: e.target.value }))} />
                            </div>
                            <div className="space-y-3">
                                {results.items.map((item) => (
                                    <div key={item._localId} className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center">
                                        <input className={inputClass} value={item.title} placeholder="Category" onChange={(e) => setResults((prev) => ({ ...prev, items: prev.items.map((entry) => (entry._localId === item._localId ? { ...entry, title: e.target.value } : entry)) }))} />
                                        <input className={inputClass} value={item.winner} placeholder="Winner" onChange={(e) => setResults((prev) => ({ ...prev, items: prev.items.map((entry) => (entry._localId === item._localId ? { ...entry, winner: e.target.value } : entry)) }))} />
                                        <input className={inputClass} value={item.country} placeholder="Country" onChange={(e) => setResults((prev) => ({ ...prev, items: prev.items.map((entry) => (entry._localId === item._localId ? { ...entry, country: e.target.value } : entry)) }))} />
                                        <button onClick={() => setResults((prev) => ({ ...prev, items: prev.items.filter((entry) => entry._localId !== item._localId) }))} className="text-xs uppercase tracking-[0.12em] text-red-400 hover:text-red-300">
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionShell>
                )}
            </div>
        </div>
    );
};

export default AdminView;

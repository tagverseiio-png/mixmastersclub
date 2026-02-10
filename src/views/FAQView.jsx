import React from 'react';
import SectionHeader from '../components/ui/SectionHeader';

const DEFAULT_FAQ = [
    {
        q: 'When is the competition held?',
        a: 'The Mix Masters Club DJ Competition will be held on 22 May 2026.',
    },
    {
        q: 'Where is the competition taking place?',
        a: 'The event will be hosted at Hard Rock Cafe, Singapore.',
    },
    {
        q: 'What is Mix Masters Club?',
        a: 'Mix Masters Club is a global DJ competition, bringing together DJs from different countries to compete live on one stage. This is not a normal tournament or league — it’s a high-impact showcase focused purely on DJ skill, creativity, and crowd control.',
    },
    {
        q: 'Is this an international competition?',
        a: 'Yes. DJs participating in Mix Masters Club represent countries including Canada, the United States, Europe, Australia, India, Malaysia, Sri Lanka, and more.',
    },
    {
        q: 'What are the prizes?',
        a: 'A total prize pool of up to SGD 20,000 will be given out. Full details will be announced soon.',
    },
    {
        q: 'How are DJs judged?',
        a: 'DJs are evaluated by a panel of experienced industry professionals, including established DJs and music curators. Judging is based on: Technical skill, Music selection, Transitions and flow, Creativity, Live crowd engagement, and Stage Presence. This is not a popularity or social media–based contest.',
    },
    {
        q: 'Who can participate?',
        a: 'Participation is by application or invitation, subject to eligibility criteria set by the organisers. Full details will be announced soon.',
    },
    {
        q: 'What music genres are allowed?',
        a: 'This is primarily a TAMIL DJ battle, where DJs are required to play at least 80% Tamil genre. The competition focuses on DJ performance quality. DJs are encouraged to showcase their strongest musical identity while respecting the event’s guidelines.',
    },
    {
        q: 'When will more details be released?',
        a: 'Details on competition format, judging criteria, and final DJ line-up will be announced closer to the event date via the official website and social channels.',
    },
];

const FAQView = ({ faq = [] }) => {
    const list = Array.isArray(faq) && faq.length > 0 ? faq : DEFAULT_FAQ;

    return (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505]">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
            <SectionHeader title="Intel" subtitle="Information" center />
            <div className="space-y-px bg-white/5 border border-white/5">
                {list.map((item, i) => (
                    <div key={i} className="bg-[#050505] p-6 md:p-10 hover:bg-[#0a0a0a] transition-colors group cursor-pointer">
                        <h3 className="font-['Cinzel'] text-white text-base md:text-lg mb-4 flex items-center gap-4 md:gap-6">
                            <span className="text-[#C5A059] text-xs font-['Montserrat']">0{i + 1}</span> {item.q}
                        </h3>
                        <p className="font-['Cormorant_Garamond'] text-lg md:text-xl text-gray-500 italic pl-6 md:pl-10 opacity-60 group-hover:opacity-100 transition-opacity">{item.a}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
    );
};

export default FAQView;

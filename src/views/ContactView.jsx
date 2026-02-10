import React from 'react';
import { Instagram } from 'lucide-react';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';

const ContactView = () => (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#020202]">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <SectionHeader title="Contact" subtitle="Concierge" center />
            <div className="grid md:grid-cols-2 gap-12 md:gap-24">
                <div className="space-y-12">
                    <div>
                        <h4 className="font-['Cinzel'] text-2xl text-white mb-2">Battle Location</h4>
                        <p className="font-['Cormorant_Garamond'] text-xl text-gray-500 italic">HardRock Cafe, Singapore</p>
                    </div>
                    <div>
                        <h4 className="font-['Cinzel'] text-2xl text-white mb-2">Inquiries</h4>
                        <p className="font-['Cormorant_Garamond'] text-xl text-gray-500 italic mb-2">admin@mixmaster.club</p>
                        <p className="font-['Montserrat'] text-[10px] text-[#C5A059] uppercase tracking-widest">
                            Direct message us on Instagram for immediate response
                        </p>
                    </div>
                    <div className="flex gap-8 pt-8">
                        <a href="https://instagram.com/mixmastersclub" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
                            <Instagram size={20} strokeWidth={1} className="text-gray-500 group-hover:text-[#C5A059] transition-colors" />
                            <span className="font-['Montserrat'] text-[10px] text-gray-600 group-hover:text-white uppercase tracking-widest transition-colors">@mixmastersclub</span>
                        </a>
                    </div>
                </div>
                <form className="space-y-10">
                    <input type="text" placeholder="NAME" className="w-full bg-transparent border-b border-white/10 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-colors" />
                    <input type="email" placeholder="EMAIL" className="w-full bg-transparent border-b border-white/10 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-colors" />
                    <textarea placeholder="MESSAGE" rows="4" className="w-full bg-transparent border-b border-white/10 py-4 text-white font-['Cinzel'] text-lg focus:border-[#C5A059] outline-none transition-colors"></textarea>
                    <div className="pt-8">
                        <Button variant="gold" className="w-full">Send Message</Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
);

export default ContactView;

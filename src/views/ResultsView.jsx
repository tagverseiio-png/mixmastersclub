import React from 'react';
import { Trophy } from 'lucide-react';
import Button from '../components/ui/Button';

const ResultsView = ({ navigateTo, results }) => (
    <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-4">
        <Trophy size={48} className="text-[#C5A059] mb-8 opacity-80" strokeWidth={1} />
        <h1 className="font-['Cinzel'] text-4xl md:text-7xl text-white mb-8">{results?.heading || 'Results Pending'}</h1>
        <p className="font-['Montserrat'] text-gray-500 text-[10px] tracking-[0.15em] md:tracking-[0.3em] uppercase mb-16">
            {results?.subtitle || 'Updates will appear here after the event.'}
        </p>
        <Button variant="secondary" onClick={() => navigateTo('home')}>Return Base</Button>
    </div>
);

export default ResultsView;

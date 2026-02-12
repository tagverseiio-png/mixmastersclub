import React from 'react';
import { Trophy } from 'lucide-react';
import Button from '../components/ui/Button';

const ResultsView = ({ navigateTo, results }) => {
    const hasResults = results && (results.heading || (results.items && results.items.length > 0));

    return (
        <div className="pt-28 md:pt-40 pb-16 md:pb-24 min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center px-4">
            {!hasResults ? (
                <>
                    <Trophy size={48} className="text-[#C5A059] mb-8 opacity-60" strokeWidth={1} />
                    <h1 className="font-['Cinzel'] text-4xl md:text-7xl text-white mb-8 tracking-[0.05em]">REVEAL SOON</h1>
                    <p className="font-['Montserrat'] text-gray-500 text-[10px] tracking-[0.15em] md:tracking-[0.3em] uppercase mb-6 max-w-md">
                        Results will be announced after the event concludes.
                    </p>
                    <div className="h-px w-16 bg-[#C5A059]/50 mx-auto mb-16" />
                    <Button variant="secondary" onClick={() => navigateTo('home')}>Return Base</Button>
                </>
            ) : (
                <>
                    <Trophy size={48} className="text-[#C5A059] mb-8 opacity-80" strokeWidth={1} />
                    <h1 className="font-['Cinzel'] text-4xl md:text-7xl text-white mb-8">{results?.heading || 'Results'}</h1>
                    <p className="font-['Montserrat'] text-gray-500 text-[10px] tracking-[0.15em] md:tracking-[0.3em] uppercase mb-16">
                        {results?.subtitle || 'Updates will appear here after the event.'}
                    </p>
                    <Button variant="secondary" onClick={() => navigateTo('home')}>Return Base</Button>
                </>
            )}
        </div>
    );
};

export default ResultsView;

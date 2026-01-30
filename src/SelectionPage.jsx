
import React from 'react';
import { Upload, Layout, ArrowRight } from 'lucide-react';

const SelectionPage = ({ onSelect, user }) => {
    // Get name from Google metadata or default to "Scholar"
    const name = user?.user_metadata?.full_name?.split(' ')[0] || "Scholar";

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans flex items-center justify-center p-6 animate-fadeIn">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <p className="text-lg text-oxford-blue/60 font-medium mb-2">
                        Hi, {name}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 pb-2">
                        Mau dibantu apa hari ini?
                    </h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Upload Option */}
                    <button
                        onClick={() => onSelect('upload')}
                        className="group relative bg-white border border-oxford-blue/10 rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 hover:border-bronze/30 hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 bg-oxford-blue/5 rounded-xl flex items-center justify-center text-oxford-blue mb-6 group-hover:bg-bronze group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-oxford-blue mb-2">Analisis</h3>
                        <p className="text-oxford-blue/60 text-sm mb-6">
                            Bedah dokumen awardee buat dapetin <span className="italic">secret sauce</span> mereka
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-bronze opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                            Select <ArrowRight size={16} />
                        </div>
                    </button>

                    {/* Canvas Option */}
                    <button
                        onClick={() => onSelect('canvas')}
                        className="group relative bg-white border border-oxford-blue/10 rounded-2xl p-8 text-left hover:shadow-xl transition-all duration-300 hover:border-bronze/30 hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 bg-oxford-blue/5 rounded-xl flex items-center justify-center text-oxford-blue mb-6 group-hover:bg-bronze group-hover:text-white transition-colors">
                            <Layout size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-oxford-blue mb-2">Canvas</h3>
                        <p className="text-oxford-blue/60 text-sm mb-6">
                            Bebas tuangin ide, rancang, dan rapihin struktur tulisan di kanvas interaktif tanpa batas
                        </p>
                        <div className="flex items-center gap-2 text-sm font-bold text-bronze opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                            Select <ArrowRight size={16} />
                        </div>
                    </button>
                </div>

                {/* Search Bar Placeholder (Visual Only as per user image request later? User didn't ask for search yet but image had it. Omit for now to keep focus on requested features) */}
            </div>
        </div>
    );
};

export default SelectionPage;

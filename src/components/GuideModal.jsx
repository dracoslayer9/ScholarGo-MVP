import React from 'react';
import { X, BookOpen, ShieldCheck } from 'lucide-react';

const GuideModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-oxford-blue/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-oxford-blue">Panduan</h2>
                        <p className="text-sm text-oxford-blue/60 mt-1">Cara memaksimalkan ScholarGo untuk hasil terbaik</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-50 rounded-full text-oxford-blue/40 hover:text-red-500 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">

                    {/* Section 1: Fitur Analisis */}
                    <section>
                        <div className="flex items-baseline gap-3 mb-3">
                            <h3 className="text-xl font-bold text-oxford-blue">1. Fitur Analisis</h3>
                            <span className="text-blue-600 text-sm font-medium">Bongkar Rahasia Esai</span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-oxford-blue/80 leading-relaxed">
                                Fitur ini dirancang untuk membedah esai awardee agar kamu paham dengan cepat struktur logika di baliknya.
                            </p>

                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-sm text-oxford-blue mb-2">Cara Pakai</h4>
                                        <div className="flex items-start gap-2 text-sm text-oxford-blue/70">
                                            <span className="mt-0.5">•</span>
                                            <span>Unggah file esai dalam format PDF</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-oxford-blue mb-2">Output Analisis</h4>
                                        <ul className="space-y-1.5">
                                            <li className="flex items-start gap-2 text-sm text-oxford-blue/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                                                <span><strong className="text-oxford-blue">Main Idea:</strong> Gagasan utama paragraf</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-oxford-blue/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                                                <span><strong className="text-oxford-blue">Development:</strong> Cara ide dikembangkan</span>
                                            </li>
                                            <li className="flex items-start gap-2 text-sm text-oxford-blue/70">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                                                <span><strong className="text-oxford-blue">Evidence:</strong> Bukti pendukung narasi</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-gray-100 w-full"></div>

                    {/* Section 2: Fitur Canvas */}
                    <section>
                        <div className="flex items-baseline gap-3 mb-3">
                            <h3 className="text-xl font-bold text-oxford-blue">2. Fitur Canvas</h3>
                            <span className="text-blue-600 text-sm font-medium">Partner Menulis Pintar</span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-oxford-blue/80 leading-relaxed">
                                Ruang kolaborasi antara idemu dan kecerdasan AI. Bukan sekadar editor teks biasa.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-200/60 transition-colors">
                                    <h4 className="font-bold text-oxford-blue text-sm mb-2">Menulis dengan Konteks</h4>
                                    <p className="text-sm text-oxford-blue/60 leading-relaxed">
                                        AI mengingat profil dan pengalamanmu, memberikan saran yang personal dan relevan.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-200/60 transition-colors">
                                    <h4 className="font-bold text-oxford-blue text-sm mb-2">Deep Review</h4>
                                    <p className="text-sm text-oxford-blue/60 leading-relaxed">
                                        Audit mendalam untuk kekuatan argumen, kesesuaian visi beasiswa, dan saran diksi akademik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>



                </div>

                {/* Footer */}
                <div className="py-3 px-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                        <ShieldCheck size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">100% Integritas Akademik</span>
                    </div>
                    <button onClick={onClose} className="text-xs font-bold text-oxford-blue/40 hover:text-oxford-blue transition-colors">
                        Tutup Panduan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideModal;

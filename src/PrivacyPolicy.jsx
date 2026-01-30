import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-white font-sans text-oxford-blue">
            <div className="max-w-3xl mx-auto px-6 py-20">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-oxford-blue/60 hover:text-oxford-blue transition-colors mb-12 font-medium"
                >
                    <ArrowLeft size={20} />
                    Kembali
                </button>

                <h1 className="text-4xl font-serif font-bold text-oxford-blue mb-4">Kebijakan Privasi ScholarGo</h1>
                <p className="text-oxford-blue/60 mb-12">Effective Date: 12 Januari 2026</p>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">1. Intro</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            Selamat datang di ScholarGo. Kami sangat menghargai privasi dan punya komitmen penuh buat jagain data personal kamu. Kebijakan ini jelasin gimana cara kami mengelola informasi kamu saat lagi asik pake fitur Analysis dan Canvas kami.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">2. Data yang Kami kumpulin:</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            Kami cuma ambil data yang emang perlu banget buat maksimalin layanan esai beasiswa kamu:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li><strong>Data Identitas:</strong> Nama dan email yang pengguna kasih via Google Authentication.</li>
                            <li><strong>Data Konten:</strong> Esai dan draf yang kamu ketik di Interactive Writing Canvas.</li>
                            <li><strong>Data Teknis:</strong> Alamat IP dan tipe browser buat monitoring keamanan dan performa lewat Supabase dan Vercel.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">3. Gimana Cara Kami Pakai Data Pengguna?</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            Data kami gunain buat:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Kasih structural analysis berbasis AI dan narrative alignment yang presisi.</li>
                            <li>Simpan semua progres kamu di laboratorium interaktif biar nggak hilang.</li>
                            <li>Jagain keamanan akun kamu biar tetap aman.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">4. Penyimpanan & Keamanan Data</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            Semua data user disimpan secara aman di Supabase (PostgreSQL) dengan enkripsi standar industri. Kami nggak jualan data personal kamu ke pihak ketiga mana pun.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">5. Hak sebagai User</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            kamu punya hak penuh buat:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Akses data personal yang kami simpan.</li>
                            <li>Minta penghapusan akun beserta seluruh data esai terkait kapan saja.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">6. Hubungi Kami</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            Kalau ada pertanyaan soal kebijakan ini, kamu bisa langsung hubungi kami lewat email support yang terdaftar di Google Cloud Console atau teamscholargo@gmail.com.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

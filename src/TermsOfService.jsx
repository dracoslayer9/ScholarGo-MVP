import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = ({ onBack }) => {
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

                <h1 className="text-4xl font-serif font-bold text-oxford-blue mb-4">Syarat & Ketentuan ScholarGo</h1>
                <p className="text-oxford-blue/60 mb-12">Last Updated: 15 Januari 2026</p>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">1. Penggunaan Layanan</h2>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>ScholarGo adalah strategic workspace berbasis AI yang dirancang untuk tujuan edukasi agar pengguna dapat membedah standar beasiswa dunia dan menyusun narasi esai yang kompetitif secara sistematis.</li>
                            <li>Kamu dilarang keras menggunakan layanan ini untuk tindakan ilegal, termasuk tapi tidak terbatas pada kecurangan akademik atau plagiarisme sistematis.</li>
                            <li>Kamu bertanggung jawab penuh atas keamanan akun Google yang kamu gunakan untuk login.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">2. Kepemilikan Konten</h2>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Kamu memegang hak penuh atas teks esai yang kamu upload ke ScholarGo.</li>
                            <li>Dengan menggunakan layanan kami, kamu memberikan izin kepada ScholarGo untuk memproses data tersebut hanya untuk memberikan hasil analisis.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">3. Batasan Tanggung Jawab (AI Disclaimer)</h2>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Analisis yang diberikan ScholarGo di-generate oleh Artificial Intelligence (AI) dan mungkin mengandung kesalahan.</li>
                            <li>ScholarGo tidak menjamin kelulusan beasiswa atau akurasi 100% dari hasil analisis.</li>
                            <li>Penggunaan hasil analisis AI dalam draf final esai adalah tanggung jawab penuh kamu sebagai pengguna.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">4. Kebijakan Akun & Data</h2>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Kami berhak membatasi akses pada Free Plan sesuai dengan kebijakan operasional yang berlaku.</li>
                            <li>Kamu bisa menghapus data riwayat chat kapan saja melalui fitur yang tersedia di aplikasi.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">5. Perubahan Ketentuan</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            Kami mungkin memperbarui ketentuan ini sewaktu-waktu untuk menyesuaikan dengan fitur baru atau regulasi hukum yang berlaku.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;

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
                    Back
                </button>

                <h1 className="text-4xl font-serif font-bold text-oxford-blue mb-4">Privacy Policy for ScholarGo</h1>
                <p className="text-oxford-blue/60 mb-12">Effective Date: January 12, 2026</p>

                <div className="space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">1. Introduction</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            Welcome to ScholarGo. We respect your privacy and are committed to protecting your personal data. This policy explains how we handle your information when you use our Analysis and Canvas features.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">2. Data We Collect</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            We only collect information necessary to provide our scholarship essay services:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li><strong>Identity Data:</strong> Name and email address provided by Google Authentication.</li>
                            <li><strong>Content Data:</strong> Essays and drafts you type into the Interactive Writing Canvas.</li>
                            <li><strong>Technical Data:</strong> IP address and browser type for security and performance monitoring via Supabase and Vercel.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">3. How We Use Your Data</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            We use your data to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Provide AI-powered structural analysis and narrative alignment.</li>
                            <li>Save your progress in the writing laboratory.</li>
                            <li>Maintain the security of your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">4. Data Storage and Security</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            All user data is stored securely using Supabase (PostgreSQL) with industry-standard encryption. We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">5. Your Rights</h2>
                        <p className="text-oxford-blue/80 leading-relaxed mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-oxford-blue/80 leading-relaxed">
                            <li>Access the personal data we hold about you.</li>
                            <li>Request the deletion of your account and all associated essay data.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-oxford-blue mb-4">6. Contact Us</h2>
                        <p className="text-oxford-blue/80 leading-relaxed">
                            If you have questions about this policy, please contact us at the support email provided in your Google Cloud Console.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

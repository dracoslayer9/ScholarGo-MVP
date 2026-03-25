import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const PaymentSuccess = ({ onContinue }) => {
    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-scaleIn">
                <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-oxford-blue mb-2">Payment Successful!</h1>
            <p className="text-oxford-blue/60 mb-8 text-center max-w-md">
                Thank you for upgrading to ScholarGo Plus. You now have unlimited access to all AI features.
            </p>

            <button
                onClick={onContinue}
                className="px-8 py-3 bg-oxford-blue text-white font-bold rounded-xl shadow-lg hover:bg-oxford-blue/90 transition-all flex items-center gap-2"
            >
                Continue to Workspace
                <ArrowRight size={18} />
            </button>
        </div>
    );
};

export default PaymentSuccess;

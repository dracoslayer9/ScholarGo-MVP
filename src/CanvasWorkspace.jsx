
import React from 'react';
import { Layout } from 'lucide-react';

const CanvasWorkspace = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-paper text-oxford-blue/60 animate-fadeIn">
            <div className="w-16 h-16 bg-oxford-blue/5 rounded-2xl flex items-center justify-center mb-6">
                <Layout size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-oxford-blue mb-2">Canvas Workspace</h2>
            <p>Coming Soon</p>
        </div>
    );
};

export default CanvasWorkspace;

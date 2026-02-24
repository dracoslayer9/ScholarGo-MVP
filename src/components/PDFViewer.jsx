import React from 'react';

export const PDFViewer = ({ url }) => {
    if (!url) {
        return (
            <div className="text-center p-8 text-oxford-blue/60 font-serif font-medium animate-pulse">
                Loading Document...
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] bg-gray-100 flex items-center justify-center">
            <object
                data={`${url}#view=FitH`}
                type="application/pdf"
                className="w-full h-full"
            >
                <div className="text-center p-8 text-oxford-blue/60 font-serif font-medium flex flex-col items-center gap-4">
                    <p>It appears your browser doesn't support built-in PDFs.</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-bronze text-white rounded-lg hover:bg-bronze/90 transition-colors">
                        Click here to download it
                    </a>
                </div>
            </object>
        </div>
    );
};

const fs = require('fs');

let content = fs.readFileSync('src/CanvasWorkspace.jsx', 'utf8');

// 1. Imports
const importsToAdd = `
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
`;
if (!content.includes('@tiptap/react')) {
  content = content.replace("import React, { useState, useRef, useEffect } from 'react';", "import React, { useState, useRef, useEffect } from 'react';\n" + importsToAdd);
}

// 2. Editor Hook
const editorHook = `
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing or paste your essay here...',
            }),
        ],
        content: essayContent,
        editorProps: {
            attributes: {
                class: 'prose prose-lg prose-oxford-blue max-w-none focus:outline-none min-h-screen whitespace-pre-wrap break-words text-oxford-blue font-serif leading-relaxed',
                spellcheck: 'true',
                autocapitalize: 'sentences'
            },
        },
        onUpdate: ({ editor }) => {
            // Check if content actually changed to avoid loop
            if (essayContent !== editor.getHTML()) {
                setEssayContent(editor.getHTML());
            }
        },
    });

    // Keeping textareaRef around just so existing focus calls don't crash before we migrate them
    const textareaRef = useRef(null);
`;

content = content.replace("const textareaRef = useRef(null);", editorHook);

// 3. Format Handler (replace the string manipulation)
const newFormatHandler = `
    const handleFormat = (formatType) => {
        if (!editor) return;

        // Handle alignment (custom implementation since StarterKit doesn't have alignment by default without TextAlign extension)
        // We'll keep the wrapping <div> alignment for now to preserve simplicity
        if (formatType === 'align-left') return setTextAlign('left');
        if (formatType === 'align-center') return setTextAlign('center');
        if (formatType === 'align-right') return setTextAlign('right');
        if (formatType === 'align-justify') return setTextAlign('justify');

        if (formatType === 'bold') editor.chain().focus().toggleBold().run();
        if (formatType === 'italic') editor.chain().focus().toggleItalic().run();
        if (formatType === 'quote') editor.chain().focus().toggleBlockquote().run();
    };
`;
// find handleFormat
const handleFormatMatch = content.match(/const handleFormat = \(formatType\) => \{[\s\S]*?\};/);
if (handleFormatMatch) {
    content = content.replace(handleFormatMatch[0], newFormatHandler);
}

// 4. Render area
const newRenderArea = `
                        {/* TIPTAP EDITOR LAYER */}
                        <div className="absolute inset-0 px-16 py-12 z-10" style={{ textAlign }}>
                            <EditorContent editor={editor} className="h-full" />
                        </div>
`;
const oldRenderRegex = /\{\/\* 1\. BACKDROP LAYER: Renders the visual markdown \*\/\}[\s\S]*?spellCheck=\{false\}\n\s*\/\>/g;
content = content.replace(oldRenderRegex, newRenderArea);

// 5. Sync essayContent back to Editor when loaded from Versions
const syncToEditor = `
    useEffect(() => {
        const currentVersion = versions.find(v => v.id === currentVersionId);
        if (currentVersion) {
            setEssayContent(currentVersion.content);
            if (editor && editor.getHTML() !== currentVersion.content) {
                editor.commands.setContent(currentVersion.content);
            }
        }
    }, [currentVersionId, editor]);
`;
content = content.replace(/useEffect\(\(\) => \{\n        const currentVersion = versions\.find\(v => v\.id === currentVersionId\);\n        if \(currentVersion\) \{\n            setEssayContent\(currentVersion\.content\);\n        \}\n    \}, \[currentVersionId\]\);/g, syncToEditor);

fs.writeFileSync('src/CanvasWorkspace.jsx', content);
console.log('Tiptap injected into CanvasWorkspace.jsx');

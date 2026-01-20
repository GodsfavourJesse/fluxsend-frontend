"use client";

import { useState } from "react";
import { X, Send, Link as LinkIcon } from "lucide-react";

type Props = {
    onSend: (text: string) => void;
    onClose: () => void;
};

function isURL(text: string): boolean {
    try {
        new URL(text);
        return true;
    } catch {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(text);
    }
}

export default function TextShareModal({ onSend, onClose }: Props) {
    const [text, setText] = useState("");
    const [isUrl, setIsUrl] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setText(value);
        setIsUrl(isURL(value.trim()));
    };

    const handlePaste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
            setIsUrl(isURL(clipboardText.trim()));
        } catch (error) {
            console.error("Failed to read clipboard");
        }
    };

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Share Text or Link</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Text area */}
                <textarea
                    value={text}
                    onChange={handleChange}
                    placeholder="Type or paste text, link, or note..."
                    className="w-full h-48 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                />

                {/* URL indicator */}
                {isUrl && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <LinkIcon size={16} />
                        <span>Looks like a link!</span>
                    </div>
                )}

                {/* Character count */}
                <div className="mt-2 text-xs text-gray-500 text-right">
                    {text.length} characters
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={handlePaste}
                        className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm"
                    >
                        Paste from Clipboard
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Send size={16} />
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
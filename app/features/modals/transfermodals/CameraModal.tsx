"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RotateCcw } from "lucide-react";

type Props = {
    onCapture: (photo: Blob) => void;
    onClose: () => void;
};

export default function CameraModal({ onCapture, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

    useEffect(() => {
        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode },
                audio: false,
            });

            setStream(mediaStream);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Camera access denied:", error);
            alert("Please allow camera access to take photos");
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setCapturedPhoto(url);
            }
        }, "image/jpeg", 0.95);
    };

    const retake = () => {
        setCapturedPhoto(null);
    };

    const confirmCapture = () => {
        if (!canvasRef.current) return;

        canvasRef.current.toBlob((blob) => {
            if (blob) {
                onCapture(blob);
                cleanup();
            }
        }, "image/jpeg", 0.95);
    };

    const cleanup = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        onClose();
    };

    const switchCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur">
                <button
                    onClick={cleanup}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition"
                >
                    <X size={24} />
                </button>

                <h2 className="text-white font-semibold">Take Photo</h2>

                <button
                    onClick={switchCamera}
                    className="text-white p-2 hover:bg-white/10 rounded-full transition"
                >
                    <RotateCcw size={24} />
                </button>
            </div>

            {/* Camera view or captured photo */}
            <div className="flex-1 relative flex items-center justify-center">
                {!capturedPhoto ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full"
                    />
                ) : (
                    <img
                        src={capturedPhoto}
                        alt="Captured"
                        className="max-w-full max-h-full"
                    />
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="p-6 bg-black/50 backdrop-blur">
                {!capturedPhoto ? (
                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 mx-auto flex items-center justify-center bg-white rounded-full border-4 border-gray-300 hover:scale-105 transition"
                    >
                        <Camera size={32} className="text-gray-800" />
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={retake}
                            className="flex-1 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                        >
                            Retake
                        </button>
                        <button
                            onClick={confirmCapture}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                            Use Photo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
"use client";

import { useState, useRef, useEffect } from "react";

interface WebcamCaptureProps {
    onCapture: (file: File) => void;
    onError?: (error: string) => void;
    label?: string;
}

export default function WebcamCapture({ onCapture, onError, label = "التقاط صورة" }: WebcamCaptureProps) {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        setIsLoading(true);
        setCapturedImage(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            setStream(mediaStream);
            setIsCameraOpen(true);
            // NOTE: srcObject is set in the useEffect below after <video> mounts
        } catch (err: any) {
            console.error("Error accessing camera:", err);
            const errorMsg = err.name === "NotAllowedError"
                ? "يرجى منح صلاحية الوصول للكاميرا من إعدادات المتصفح."
                : "تعذر الوصول إلى الكاميرا. يرجى التأكد من توصيلها وعدم استخدامها بواسطة تطبيق آخر.";
            if (onError) onError(errorMsg);
            alert(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    // Assign srcObject AFTER the <video> element is rendered
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            if (context) {
                // Crop to a square from the center of the video feed
                const size = Math.min(video.videoWidth, video.videoHeight);
                canvas.width = size;
                canvas.height = size;
                
                const startX = (video.videoWidth - size) / 2;
                const startY = (video.videoHeight - size) / 2;

                // Draw the mirrored square portion (optional mirroring, but standard is just crop)
                context.drawImage(video, startX, startY, size, size, 0, 0, size, size);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
                        const imageUrl = URL.createObjectURL(blob);
                        setCapturedImage(imageUrl);
                        onCapture(file);
                        stopCamera();
                    }
                }, "image/jpeg", 0.9);
            }
        }
    };

    return (
        <div style={{ width: "100%", textAlign: "center" }}>
            {capturedImage ? (
                <div style={{ position: "relative", display: "inline-block", width: 220, height: 220, borderRadius: "50%", overflow: "hidden", border: "4px solid var(--primary-light)", margin: "0 auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <img src={capturedImage} alt="Captured preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <button
                        type="button"
                        onClick={startCamera}
                        className="btn btn-sm btn-primary"
                        style={{ position: "absolute", bottom: 15, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", fontSize: "0.8rem", borderRadius: "var(--radius-full)" }}
                    >
                        إعادة التصوير
                    </button>
                </div>
            ) : isCameraOpen ? (
                <div style={{ position: "relative", display: "inline-block", width: 250, height: 250, borderRadius: "50%", overflow: "hidden", background: "#000", margin: "0 auto", border: "4px solid var(--gray-200)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }} 
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    
                    {/* Capture Frame Overlay */}
                    <div style={{ position: "absolute", inset: 0, border: "2px dashed rgba(255,255,255,0.4)", borderRadius: "50%", pointerEvents: "none", margin: "10px" }} />

                    <div style={{ position: "absolute", bottom: 15, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 10 }}>
                        <button
                            type="button"
                            onClick={handleCapture}
                            style={{ 
                                width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.4)", 
                                border: "4px solid white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                padding: 0, outline: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                            }}
                            title="التقاط"
                        >
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "white" }} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={stopCamera}
                        style={{ 
                            position: "absolute", top: 15, right: "50%", transform: "translateX(50%)",
                            background: "rgba(0,0,0,0.5)", color: "white", border: "none", borderRadius: "var(--radius-full)",
                            padding: "4px 12px", fontSize: "0.80rem", cursor: "pointer", zIndex: 10
                        }}
                    >
                        إلغاء
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={startCamera}
                    disabled={isLoading}
                    style={{ 
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
                        width: "100%", background: "transparent", border: "none", padding: 0
                    }}
                >
                    <div style={{ background: "var(--primary-light)", color: "var(--primary)", width: 60, height: 60, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
                        {isLoading ? (
                           <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                               <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
                           </svg>
                        ) : (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        )}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--navy-800)", display: "block", fontSize: "1.05rem" }}>
                        {isLoading ? "جاري تشغيل الكاميرا..." : label}
                    </span>
                </button>
            )}
        </div>
    );
}

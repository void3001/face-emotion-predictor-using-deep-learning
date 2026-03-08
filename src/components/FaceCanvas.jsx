import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { classifyFaceShape } from '../utils/faceShape';

// Load models dynamically relative to Vite's base URL (essential for GitHub Pages)
const MODEL_URL = import.meta.env.BASE_URL + 'models';



const EMOTION_EMOJIS = {
    happy: { emoji: '😄', label: 'Happy', color: '#FFD700' },
    sad: { emoji: '😢', label: 'Sad', color: '#6495ED' },
    angry: { emoji: '😠', label: 'Angry', color: '#FF4500' },
    fearful: { emoji: '😨', label: 'Fearful', color: '#9370DB' },
    disgusted: { emoji: '🤢', label: 'Disgusted', color: '#32CD32' },
    surprised: { emoji: '😲', label: 'Surprised', color: '#FF69B4' },
    neutral: { emoji: '😐', label: 'Neutral', color: '#A0A0A0' },
};

const FACE_SHAPE_COLORS = {
    Oval: '#6C63FF',
    Round: '#FF6584',
    Square: '#43BCCD',
    Heart: '#F72585',
    Oblong: '#7FB069',
    Rectangular: '#F4A261',
    Diamond: '#9B5DE5',
    Unknown: '#555555',
};

export default function FaceCanvas({ onDetection }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [error, setError] = useState(null);
    const [faceCount, setFaceCount] = useState(0);

    // Load face-api models
    useEffect(() => {
        async function loadModels() {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                setModelsLoaded(true);
            } catch (e) {
                console.error('Model load error:', e);
                setError('Failed to load AI models. Check your connection.');
            }
        }
        loadModels();
    }, []);

    // Start webcam
    useEffect(() => {
        if (!modelsLoaded) return;
        async function startCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 720 }, height: { ideal: 540 }, facingMode: 'user' },
                });
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                };
            } catch (e) {
                console.error('Camera error:', e);
                setError('Camera access denied. Please allow camera permissions.');
            }
        }
        startCamera();
        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, [modelsLoaded]);

    // Detection loop
    const runDetection = useCallback(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) {
            animRef.current = requestAnimationFrame(runDetection);
            return;
        }

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 }))
            .withFaceLandmarks()
            .withFaceExpressions();

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        setFaceCount(detections.length);

        const resized = faceapi.resizeResults(detections, displaySize);

        resized.forEach((det) => {
            const { x, y, width, height } = det.detection.box;
            const landmarks = det.landmarks;
            const expressions = det.expressions;

            // Face shape
            const pts = landmarks.positions;
            const shapeResult = classifyFaceShape(pts);
            const shapeColor = FACE_SHAPE_COLORS[shapeResult.shape] || '#fff';

            // Top emotion
            const topEmotion = Object.entries(expressions).reduce((a, b) => (b[1] > a[1] ? b : a));
            const emotionKey = topEmotion[0];
            const emotionConf = topEmotion[1];
            const emotionInfo = EMOTION_EMOJIS[emotionKey] || { emoji: '❓', label: emotionKey, color: '#fff' };

            // ── Draw bounding box ──────────────────────────────────────────────────
            ctx.save();
            ctx.strokeStyle = shapeColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = shapeColor;
            ctx.shadowBlur = 12;
            // Corner brackets instead of full box
            const cornerLen = Math.min(width, height) * 0.15;
            const corners = [
                [x, y, cornerLen, 0, cornerLen, 0, 0, cornerLen],
                [x + width, y, -cornerLen, 0, -cornerLen, 0, 0, cornerLen],
                [x, y + height, cornerLen, 0, cornerLen, 0, 0, -cornerLen],
                [x + width, y + height, -cornerLen, 0, -cornerLen, 0, 0, -cornerLen],
            ];
            corners.forEach(([cx, cy, dx1, dy1, dx2, dy2, dx3, dy3]) => {
                ctx.beginPath();
                ctx.moveTo(cx + dx1, cy + dy1);
                ctx.lineTo(cx, cy);
                ctx.lineTo(cx + dx2, cy + dy2);
                ctx.stroke();
                void dx3; void dy3;
            });
            ctx.restore();

            // ── Draw landmarks dots ────────────────────────────────────────────────
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            pts.forEach((pt) => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();

            // ── Face shape label (top of box) ──────────────────────────────────────
            const shapeText = `${shapeResult.emoji}  ${shapeResult.shape}`;
            ctx.save();
            ctx.font = 'bold 15px Inter, sans-serif';
            const shapeMetrics = ctx.measureText(shapeText);
            const labelPad = 10;
            const labelH = 28;
            const labelW = shapeMetrics.width + labelPad * 2;
            const labelX = x + width / 2 - labelW / 2;
            const labelY = y - labelH - 6;

            // Pill background
            ctx.fillStyle = shapeColor;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.roundRect(labelX, labelY, labelW, labelH, 14);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(shapeText, labelX + labelW / 2, labelY + labelH / 2);
            ctx.restore();

            // ── Emotion label (bottom of box) ──────────────────────────────────────
            const emotionText = `${emotionInfo.emoji}  ${emotionInfo.label}  ${(emotionConf * 100).toFixed(0)}%`;
            ctx.save();
            ctx.font = 'bold 14px Inter, sans-serif';
            const emMetrics = ctx.measureText(emotionText);
            const emW = emMetrics.width + labelPad * 2;
            const emX = x + width / 2 - emW / 2;
            const emY = y + height + 6;

            ctx.fillStyle = emotionInfo.color;
            ctx.globalAlpha = 0.88;
            ctx.beginPath();
            ctx.roundRect(emX, emY, emW, labelH, 14);
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#111';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emotionText, emX + emW / 2, emY + labelH / 2);
            ctx.restore();

            // Notify parent with detection data
            onDetection?.({
                shape: shapeResult,
                emotion: { key: emotionKey, ...emotionInfo, confidence: emotionConf },
                allExpressions: expressions,
            });
        });

        // No face message
        if (resized.length === 0 && onDetection) {
            onDetection(null);
        }

        animRef.current = requestAnimationFrame(runDetection);
    }, [onDetection]);

    useEffect(() => {
        if (!cameraReady) return;
        animRef.current = requestAnimationFrame(runDetection);
        return () => cancelAnimationFrame(animRef.current);
    }, [cameraReady, runDetection]);

    return (
        <div className="face-canvas-wrapper">
            {error && (
                <div className="error-overlay">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                </div>
            )}
            {!modelsLoaded && !error && (
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p>Loading AI models…</p>
                </div>
            )}
            {modelsLoaded && !cameraReady && !error && (
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p>Starting camera…</p>
                </div>
            )}

            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`face-video ${cameraReady ? 'visible' : ''}`}
            />
            <canvas ref={canvasRef} className="face-overlay-canvas" />

            {cameraReady && (
                <div className={`face-count-badge ${faceCount > 0 ? 'detected' : ''}`}>
                    {faceCount > 0 ? `${faceCount} Face${faceCount > 1 ? 's' : ''} Detected` : 'No Face Detected'}
                </div>
            )}
        </div>
    );
}

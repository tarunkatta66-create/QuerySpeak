import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type OrbStatus = 'idle' | 'listening' | 'thinking' | 'done' | 'error';

interface VoiceOrbProps {
  status: OrbStatus;
  thinkingStage?: string;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  status,
  thinkingStage = 'Processing query...',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [micGranted, setMicGranted] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animIdRef = useRef<number | null>(null);

  // Setup Web Audio API when listening
  useEffect(() => {
    if (status !== 'listening') {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      return;
    }

    let stream: MediaStream | null = null;

    async function initAudio() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicGranted(true);

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        drawBars();
      } catch (err) {
        console.warn('Microphone access not granted or unavailable:', err);
        setMicGranted(false);
        drawFallbackBars();
      }
    }

    const drawBars = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;
        const barCount = 24;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[dataIndex] || 0;
          const barHeight = 8 + (val / 255) * 35;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barHeight);
          const y2 = centerY + Math.sin(angle) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#16A394';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        animIdRef.current = requestAnimationFrame(render);
      };

      render();
    };

    const drawFallbackBars = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let step = 0;
      const render = () => {
        step += 0.05;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 60;
        const barCount = 24;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const barHeight = 8 + Math.sin(step + i * 0.5) * 15;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barHeight);
          const y2 = centerY + Math.sin(angle) * (radius + barHeight);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = '#16A394';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
        }

        animIdRef.current = requestAnimationFrame(render);
      };

      render();
    };

    initAudio();

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [status]);

  return (
    <div
      onClick={onClick}
      className="relative w-[180px] h-[180px] mx-auto flex items-center justify-center cursor-pointer select-none group"
      title="Click to toggle orb status"
    >
      {/* Idle State */}
      {status === 'idle' && (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-36 h-36 rounded-full bg-gradient-to-tr from-accentCoral/30 to-accentTeal/30 border border-accentCoral/40 flex items-center justify-center shadow-lg"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accentCoral/60 to-accentTeal/60 backdrop-blur-sm" />
        </motion.div>
      )}

      {/* Listening State */}
      {status === 'listening' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={180}
            height={180}
            className="absolute inset-0 z-10"
          />
          <div className="w-28 h-28 rounded-full bg-accentTeal/20 border border-accentTeal flex items-center justify-center">
            <span className="text-xs font-semibold text-accentTeal uppercase tracking-wider">
              {micGranted ? 'Listening' : 'Listening (Simulated)'}
            </span>
          </div>
        </div>
      )}

      {/* Thinking State */}
      {status === 'thinking' && (
        <div className="relative w-36 h-36 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full p-1 bg-[conic-gradient(from_0deg,#FF6B4A,#16A394,#FF6B4A)]"
          />
          <div className="w-32 h-32 rounded-full bg-surface z-10 flex flex-col items-center justify-center p-2 text-center shadow-md">
            <span className="text-xs font-medium text-muted animate-pulse">
              {thinkingStage}
            </span>
          </div>
        </div>
      )}

      {/* Done State */}
      {status === 'done' && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.4, type: 'spring', stiffness: 300 }}
          className="w-36 h-36 rounded-full bg-gradient-to-tr from-accentTeal to-success flex items-center justify-center shadow-xl text-white font-bold"
        >
          <svg className="w-12 h-12 stroke-current" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <motion.div
          animate={{ opacity: [1, 0.2, 1, 0.2, 1] }}
          transition={{ duration: 0.8 }}
          className="w-36 h-36 rounded-full bg-error/20 border-2 border-error flex items-center justify-center shadow-lg"
        >
          <span className="text-error font-bold text-sm">Error</span>
        </motion.div>
      )}
    </div>
  );
};

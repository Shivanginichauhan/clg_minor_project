import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Volume2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { captchaService, CaptchaChallenge, CaptchaType } from '../../services/captchaService.js';

interface DynamicCaptchaProps {
  onChallengeChange?: (challengeId: string) => void;
  onVerify?: (isValid: boolean) => void;
  preferredType?: CaptchaType;
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
}

export const DynamicCaptcha: React.FC<DynamicCaptchaProps> = ({
  onChallengeChange,
  onVerify,
  preferredType,
  value,
  onChange,
  hasError,
}) => {
  const [challenge, setChallenge] = useState<CaptchaChallenge>(() =>
    captchaService.generateChallenge(preferredType)
  );
  const [timeLeft, setTimeLeft] = useState<number>(challenge.expiresInSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize or re-render canvas when challenge updates
  useEffect(() => {
    setTimeLeft(challenge.expiresInSeconds);
    onChallengeChange?.(challenge.id);

    if (challenge.type === 'visual_canvas' && challenge.canvasCode && canvasRef.current) {
      drawCanvasCaptcha(canvasRef.current, challenge.canvasCode);
    }
  }, [challenge]);

  // Countdown timer for Redis TTL
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-refresh when TTL expires
          handleRefresh();
          return challenge.expiresInSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge.id]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const next = captchaService.generateChallenge(preferredType);
    setChallenge(next);
    onChange('');
    onVerify?.(false);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleAudioReadout = () => {
    if (challenge.type === 'visual_canvas' && challenge.canvasCode) {
      captchaService.speakCode(challenge.canvasCode);
    } else if (challenge.type === 'math_algorithmic' && challenge.questionText) {
      captchaService.speakCode(challenge.questionText.replace('?', 'what is'));
    }
  };

  // Draw distorted alphanumeric security code on HTML5 canvas
  const drawCanvasCaptcha = (canvas: HTMLCanvasElement, text: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Background gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#F1F5F9');
    grad.addColorStop(0.5, '#E2E8F0');
    grad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw random noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 200)}, 0.4)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw random interference bezier curves
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(30, 90, 168, ${0.25 + Math.random() * 0.35})`;
      ctx.lineWidth = 1 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * height);
      ctx.bezierCurveTo(
        width * 0.3, Math.random() * height,
        width * 0.7, Math.random() * height,
        width, Math.random() * height
      );
      ctx.stroke();
    }

    // 4. Draw distorted letters with varying angles and fonts
    const letterWidth = (width - 30) / text.length;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.save();

      const x = 16 + i * letterWidth;
      const y = height / 2 + (Math.random() * 8 - 4);
      const angle = (Math.random() * 32 - 16) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `bold ${Math.floor(22 + Math.random() * 6)}px 'Courier New', monospace`;
      // Alternating deep university colors
      ctx.fillStyle = i % 2 === 0 ? '#0F2747' : '#1E5AA8';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(char, 0, 8);
      ctx.restore();
    }
  };

  const ttlPercent = Math.max(0, Math.min(100, (timeLeft / challenge.expiresInSeconds) * 100));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-[#1E5AA8]" />
          <span>Security Verification Challenge</span>
        </label>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <span>Expires in:</span>
          <span className={`font-bold ${timeLeft <= 15 ? 'text-rose-600 animate-pulse' : 'text-[#1E5AA8]'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Visual Challenge Box */}
      <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
        {challenge.type === 'visual_canvas' ? (
          <div className="relative overflow-hidden rounded-lg border border-slate-300 shadow-inner bg-slate-200 flex-1 h-[48px] flex items-center justify-center">
            <canvas ref={canvasRef} width={200} height={48} className="w-full h-full object-cover select-none" />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-lg border border-blue-200 shadow-inner bg-gradient-to-r from-blue-50 to-indigo-50/60 flex-1 h-[48px] flex items-center justify-center px-4 font-academic-serif font-black tracking-wider text-base text-[#0F2747] select-none">
            {challenge.questionText}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleAudioReadout}
            title="Listen to verification challenge"
            className="p-2 rounded-lg text-slate-500 hover:text-[#1E5AA8] hover:bg-white transition border border-transparent hover:border-slate-200 shadow-xs cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            title="Generate new challenge"
            className="p-2 rounded-lg text-slate-500 hover:text-[#1E5AA8] hover:bg-white transition border border-transparent hover:border-slate-200 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1E5AA8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* TTL Progress Line */}
      <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            timeLeft <= 15 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#1E5AA8] to-blue-400'
          }`}
          style={{ width: `${ttlPercent}%` }}
        />
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            challenge.type === 'visual_canvas'
              ? 'Enter the 5 characters shown above'
              : 'Enter calculated numeric answer'
          }
          autoComplete="off"
          spellCheck={false}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold tracking-wide transition outline-none ${
            hasError
              ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500'
              : 'border-slate-200 bg-white text-slate-800 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-100'
          }`}
        />
        {value.length > 0 && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {hasError && (
        <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Security challenge answer incorrect or expired. Please solve again.</span>
        </p>
      )}
    </div>
  );
};

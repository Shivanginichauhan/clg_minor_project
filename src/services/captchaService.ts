/**
 * Dynamic Security CAPTCHA Engine
 * Supports Multi-Mode Canvas Distortions, Multi-Op Arithmetic Challenges & Redis TTL Protection
 */

import { redis } from '../lib/redisCache.js';

export type CaptchaType = 'visual_canvas' | 'math_algorithmic';

export interface CaptchaChallenge {
  id: string;
  type: CaptchaType;
  questionText?: string;     // Text for math challenges
  canvasCode?: string;       // String to render on HTML5 canvas
  expiresInSeconds: number;
  timestamp: number;
}

class CaptchaService {
  private chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz'; // Removed confusing 0/O/1/I/l

  /**
   * Generate a new challenge (either visual canvas or math challenge)
   */
  public generateChallenge(preferredType?: CaptchaType): CaptchaChallenge {
    const id = `cap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const type = preferredType || (Math.random() > 0.45 ? 'visual_canvas' : 'math_algorithmic');
    const ttlSeconds = 90; // 90 seconds challenge validity

    if (type === 'visual_canvas') {
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
      }

      // Store in Redis with TTL
      redis.setex(`captcha:${id}`, ttlSeconds, {
        answer: code.toLowerCase(),
        type: 'visual_canvas',
      });

      return {
        id,
        type: 'visual_canvas',
        canvasCode: code,
        expiresInSeconds: ttlSeconds,
        timestamp: Date.now(),
      };
    } else {
      // Math challenge with 4 operator varieties
      const formulaPattern = Math.floor(Math.random() * 4);
      let question = '';
      let answer = 0;

      if (formulaPattern === 0) {
        // (a × b) + c
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 15) + 3;
        question = `(${a} × ${b}) + ${c} = ?`;
        answer = a * b + c;
      } else if (formulaPattern === 1) {
        // a² + b
        const a = Math.floor(Math.random() * 6) + 3; // 3..8
        const b = Math.floor(Math.random() * 12) + 4;
        question = `${a}² + ${b} = ?`;
        answer = a * a + b;
      } else if (formulaPattern === 2) {
        // (a + b) × c
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 4) + 2;
        question = `(${a} + ${b}) × ${c} = ?`;
        answer = (a + b) * c;
      } else {
        // a × b − c
        const a = Math.floor(Math.random() * 9) + 3;
        const b = Math.floor(Math.random() * 6) + 2;
        const prod = a * b;
        const c = Math.floor(Math.random() * Math.min(prod - 1, 15)) + 2;
        question = `${a} × ${b} − ${c} = ?`;
        answer = prod - c;
      }

      // Store in Redis with TTL
      redis.setex(`captcha:${id}`, ttlSeconds, {
        answer: String(answer),
        type: 'math_algorithmic',
      });

      return {
        id,
        type: 'math_algorithmic',
        questionText: question,
        expiresInSeconds: ttlSeconds,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate user-provided CAPTCHA answer against Redis
   */
  public validate(challengeId: string, userInput: string): { isValid: boolean; error?: string } {
    const key = `captcha:${challengeId}`;
    const stored = redis.get<{ answer: string; type: CaptchaType }>(key);

    // One-time use: Delete immediately after reading (replay attack prevention)
    redis.del(key);

    if (!stored) {
      return {
        isValid: false,
        error: 'Security challenge has expired or is invalid. Please solve the refreshed challenge.',
      };
    }

    const cleanInput = userInput.trim().toLowerCase();
    const cleanAnswer = stored.answer.trim().toLowerCase();

    if (cleanInput === cleanAnswer) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: 'Security challenge answer is incorrect. Please try again.',
    };
  }

  /**
   * Speak CAPTCHA code for accessibility
   */
  public speakCode(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const chars = text.split('').join(' ');
      const utterance = new SpeechSynthesisUtterance(`Security verification code: ${chars}`);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[CAPTCHA] Audio readout failed:', e);
    }
  }
}

export const captchaService = new CaptchaService();

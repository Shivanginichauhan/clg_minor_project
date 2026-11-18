/**
 * Enterprise Dynamic Rate Limiting Engine
 * Built on Redis In-Memory Token Bucket & Sliding Window Log Architecture
 */

import { redis } from '../lib/redisCache.js';

export interface RateLimitPolicy {
  maxAttempts: number;      // Maximum allowed requests within the time window
  windowSeconds: number;    // Sliding window duration in seconds
  lockoutSeconds: number;   // Lockout penalty if max attempts exceeded
  actionName: string;       // Human-readable identifier
}

export interface RateLimitStatus {
  isAllowed: boolean;
  remainingAttempts: number;
  maxAttempts: number;
  windowSeconds: number;
  isLocked: boolean;
  lockRemainingSeconds: number;
  resetInSeconds: number;
  currentAttempts: number;
  retryAfterSeconds?: number;
}

const DEFAULT_POLICIES: Record<string, RateLimitPolicy> = {
  'auth:login': {
    maxAttempts: 5,
    windowSeconds: 60,
    lockoutSeconds: 300, // 5 min lockout
    actionName: 'Sign In Authentication',
  },
  'auth:signup': {
    maxAttempts: 3,
    windowSeconds: 120,
    lockoutSeconds: 600, // 10 min lockout
    actionName: 'Account Registration',
  },
  'auth:forgot-password': {
    maxAttempts: 3,
    windowSeconds: 180,
    lockoutSeconds: 300,
    actionName: 'Password Reset Request',
  },
  'dean:statutory-pin': {
    maxAttempts: 3,
    windowSeconds: 180,
    lockoutSeconds: 300,
    actionName: 'Dean Security Authorization PIN',
  },
  'academic:revaluation': {
    maxAttempts: 2,
    windowSeconds: 60,
    lockoutSeconds: 120,
    actionName: 'Re-evaluation Application Submission',
  },
  'api:general': {
    maxAttempts: 60,
    windowSeconds: 60,
    lockoutSeconds: 60,
    actionName: 'General API Queries',
  },
};

class RateLimitService {
  private policies: Map<string, RateLimitPolicy> = new Map();

  constructor() {
    Object.entries(DEFAULT_POLICIES).forEach(([key, policy]) => {
      this.policies.set(key, policy);
    });
  }

  public getPolicy(action: string): RateLimitPolicy {
    return (
      this.policies.get(action) || {
        maxAttempts: 10,
        windowSeconds: 60,
        lockoutSeconds: 120,
        actionName: action,
      }
    );
  }

  public setCustomPolicy(action: string, policy: RateLimitPolicy): void {
    this.policies.set(action, policy);
  }

  private getKey(action: string, identifier: string = 'client_global'): { attemptsKey: string; lockKey: string } {
    const cleanId = identifier.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return {
      attemptsKey: `ratelimit:attempts:${action}:${cleanId}`,
      lockKey: `ratelimit:lockout:${action}:${cleanId}`,
    };
  }

  /**
   * Check rate limit status without incrementing attempt count
   */
  public checkLimit(action: string, identifier: string = 'client_global'): RateLimitStatus {
    const policy = this.getPolicy(action);
    const { attemptsKey, lockKey } = this.getKey(action, identifier);

    // 1. Check if locked out
    const lockTtl = redis.ttl(lockKey);
    if (lockTtl > 0) {
      return {
        isAllowed: false,
        remainingAttempts: 0,
        maxAttempts: policy.maxAttempts,
        windowSeconds: policy.windowSeconds,
        isLocked: true,
        lockRemainingSeconds: lockTtl,
        resetInSeconds: lockTtl,
        currentAttempts: policy.maxAttempts,
        retryAfterSeconds: lockTtl,
      };
    }

    // 2. Read current sliding window attempts
    const attempts = redis.get<number>(attemptsKey) || 0;
    const windowTtl = redis.ttl(attemptsKey);
    const resetInSeconds = windowTtl > 0 ? windowTtl : policy.windowSeconds;
    const remaining = Math.max(0, policy.maxAttempts - attempts);

    return {
      isAllowed: remaining > 0,
      remainingAttempts: remaining,
      maxAttempts: policy.maxAttempts,
      windowSeconds: policy.windowSeconds,
      isLocked: false,
      lockRemainingSeconds: 0,
      resetInSeconds,
      currentAttempts: attempts,
      retryAfterSeconds: remaining > 0 ? undefined : resetInSeconds,
    };
  }

  /**
   * Record an attempt (increments attempt counter and triggers lockout if threshold hit)
   */
  public recordAttempt(action: string, identifier: string = 'client_global'): RateLimitStatus {
    const policy = this.getPolicy(action);
    const { attemptsKey, lockKey } = this.getKey(action, identifier);

    // Check lock
    const currentStatus = this.checkLimit(action, identifier);
    if (currentStatus.isLocked) {
      return currentStatus;
    }

    // Increment attempts
    const attempts = redis.incr(attemptsKey);
    // If it's the first attempt, attach TTL
    if (attempts === 1 || redis.ttl(attemptsKey) <= 0) {
      redis.expire(attemptsKey, policy.windowSeconds);
    }

    // Check if threshold breached
    if (attempts >= policy.maxAttempts) {
      // Trigger lockout
      redis.setex(lockKey, policy.lockoutSeconds, { lockedAt: Date.now() });
      redis.del(attemptsKey); // Clear attempts once locked

      return {
        isAllowed: false,
        remainingAttempts: 0,
        maxAttempts: policy.maxAttempts,
        windowSeconds: policy.windowSeconds,
        isLocked: true,
        lockRemainingSeconds: policy.lockoutSeconds,
        resetInSeconds: policy.lockoutSeconds,
        currentAttempts: policy.maxAttempts,
        retryAfterSeconds: policy.lockoutSeconds,
      };
    }

    const windowTtl = redis.ttl(attemptsKey);
    const resetInSeconds = windowTtl > 0 ? windowTtl : policy.windowSeconds;
    const remaining = Math.max(0, policy.maxAttempts - attempts);

    return {
      isAllowed: true,
      remainingAttempts: remaining,
      maxAttempts: policy.maxAttempts,
      windowSeconds: policy.windowSeconds,
      isLocked: false,
      lockRemainingSeconds: 0,
      resetInSeconds,
      currentAttempts: attempts,
    };
  }

  /**
   * Reset rate limit state for an action (e.g. on successful login)
   */
  public resetLimit(action: string, identifier: string = 'client_global'): void {
    const { attemptsKey, lockKey } = this.getKey(action, identifier);
    redis.del(attemptsKey, lockKey);
  }
}

export const rateLimitService = new RateLimitService();

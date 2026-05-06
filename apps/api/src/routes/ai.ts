import axios from 'axios';
import { Router } from 'express';

import { env } from '../lib/env';
import { signServiceRequest } from '../lib/hmac';
import { authenticate, type AuthRequest } from '../middleware/auth';

const router = Router();

const AI_BASE = env.AI_SERVICE_URL;

/** Build axios config with HMAC auth headers. */
function aiConfig(body: unknown) {
  const headers = signServiceRequest(body);
  return {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    timeout: 90_000,
  };
}

// ─── POST /api/v1/ai/plan ───────────────────────────────────────────

router.post('/plan', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as {
      prompt?: string;
      destination?: string;
      nights?: number;
      budgetBand?: string;
      currency?: string;
      preferences?: string[];
    };

    const payload = {
      prompt: body.prompt ?? '',
      destination: body.destination,
      nights: body.nights ?? 3,
      budget_band: body.budgetBand ?? 'moderate',
      currency: body.currency ?? 'INR',
      preferences: body.preferences ?? [],
    };

    const { data } = await axios.post(`${AI_BASE}/v1/ai/plan`, payload, aiConfig(payload));
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/ai/plan/refine (SSE streaming) ───────────────────

router.post('/plan/refine', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as {
      previousPlan: object;
      userMessage: string;
      context?: object;
    };

    const payload = {
      previous_plan: body.previousPlan,
      user_message: body.userMessage,
      context: body.context,
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const response = await axios.post(`${AI_BASE}/v1/ai/plan/refine`, payload, {
      ...aiConfig(payload),
      responseType: 'stream',
      timeout: 120_000,
    });

    (response.data as NodeJS.ReadableStream).pipe(res);
    (response.data as NodeJS.ReadableStream).on('end', () => res.end());
    (response.data as NodeJS.ReadableStream).on('error', (err: Error) => next(err));
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/ai/optimize-budget ───────────────────────────────

router.post('/optimize-budget', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as {
      itinerary: object;
      newBudget: number;
      currency?: string;
    };

    const payload = {
      itinerary: body.itinerary,
      new_budget: body.newBudget,
      currency: body.currency ?? 'INR',
    };

    const { data } = await axios.post(`${AI_BASE}/v1/ai/optimize-budget`, payload, aiConfig(payload));
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/ai/caption ───────────────────────────────────────

router.post('/caption', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { imageUrl: string; context?: object };
    const payload = { image_url: body.imageUrl, context: body.context };
    const { data } = await axios.post(`${AI_BASE}/v1/ai/caption`, payload, aiConfig(payload));
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/ai/hashtags ──────────────────────────────────────

router.post('/hashtags', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as {
      postContent: string;
      destination?: string;
      vacationType?: string;
    };
    const payload = {
      post_content: body.postContent,
      destination: body.destination,
      vacation_type: body.vacationType,
    };
    const { data } = await axios.post(`${AI_BASE}/v1/ai/hashtags`, payload, aiConfig(payload));
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

export default router;

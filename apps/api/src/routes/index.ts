import { Router } from 'express';
import express from 'express';
import path from 'path';

import healthRouter from './health';
import authRouter from './auth';
import usersRouter from './users';
import postsRouter from './posts';
import feedRouter from './feed';
import aiRouter from './ai';
import travelRouter from './travel';
import tripsRouter from './trips';
import circlesRouter from './circles';
import expensesRouter from './expenses';
import mapsRouter from './maps';
import weatherRouter from './weather';
import { adminRouter as adminPackingRouter, publicRouter as publicPackingTemplatesRouter } from './admin-packing';

const router = Router();

// Health (public)
router.use('/api', healthRouter);

// Sprint 1: Auth routes
router.use('/api/v1/auth', authRouter);

// Sprint 1: User routes
router.use('/api/v1/users', usersRouter);

// Sprint 2: Posts & Social
router.use('/api/v1/posts', postsRouter);
router.use('/api/v1/feed', feedRouter);

// Serve local uploads in development
router.use('/uploads', express.static(path.resolve(process.cwd(), 'data/uploads')));

// Sprint 3: AI / Travel
router.use('/api/v1/ai', aiRouter);
router.use('/api/v1/travel', travelRouter);

// Sprint 4: Trips / Maps / Weather
router.use('/api/v1/trips', tripsRouter);
router.use('/api/v1/maps', mapsRouter);
router.use('/api/v1/weather', weatherRouter);

router.use('/api/v1/admin/packing-templates', adminPackingRouter);
router.use('/api/v1/packing-templates', publicPackingTemplatesRouter);

router.use('/api/v1/circles', circlesRouter);

// Sprint 7: JustSplit (added in S7)
router.use('/api/v1/expenses', expensesRouter);

// Sprint 8: Journey + Atlas (added in S8)
// router.use('/api/v1/journeys', journeysRouter);
// router.use('/api/v1/atlas', atlasRouter);
// router.use('/api/v1/gamification', gamificationRouter);

// Sprint 9: Notifications + Admin
// router.use('/api/v1/notifications', notificationsRouter);
// router.use('/api/v1/admin', adminRouter);

// Sprint 11: MCP
// router.use('/api/v1/mcp', mcpRouter);

export default router;

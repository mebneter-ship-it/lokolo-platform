import { Router } from 'express';
import authRoutes from './auth';
import meRoutes from './me';
import businessRoutes from './businesses';
import supplierRoutes from './supplier';
import adminRoutes from './admin';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/businesses', businessRoutes);
router.use('/supplier', supplierRoutes);
router.use('/admin', adminRoutes);

export default router;

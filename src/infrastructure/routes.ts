import { Router } from 'express';
import { MeasureController } from './controllers/MeasureController';
import { UploadMeasure } from '../application/UploadMeasure';
import { MeasureRepository } from '../infrastructure/repositories/MeasureRepository';
import { GeminiService } from '../infrastructure/services/GeminiService';
import { validateMeasureAndSetDate } from '../middlewares/measureValidator';

const router = Router();
const measureRepository = new MeasureRepository();
const geminiService = new GeminiService();
const uploadMeasure = new UploadMeasure(measureRepository, geminiService);
const measureController = new MeasureController(uploadMeasure, measureRepository);

// Rotas da Aplicação:
router.post('/upload', validateMeasureAndSetDate, (req, res) => measureController.upload(req, res));
router.get('/measures', (req, res) => measureController.list(req, res));
router.get('/measures/:id', (req, res) => measureController.findById(req, res));
router.put('/measures/:id', validateMeasureAndSetDate, (req, res) => measureController.update(req, res));
router.delete('/measures/:id', (req, res) => measureController.delete(req, res));
router.get('/:customer_code/list', (req, res) => measureController.listByCustomerCode(req, res));

export default router;

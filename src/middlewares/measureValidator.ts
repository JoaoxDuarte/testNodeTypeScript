import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { DateTime } from 'luxon';

const timeZone = 'America/Sao_Paulo';

const measureSchema = Joi.object({
    uuid: Joi.string().guid().optional(),
    customer_code: Joi.string().min(1).required(),
    imageUrl: Joi.string().required(),
    measure_datetime: Joi.string().isoDate().optional(),
    measure_type: Joi.string().valid('WATER', 'GAS').required(),
    measureValue: Joi.number().optional(),
    hasConfirmed: Joi.boolean().optional()
});

export const validateMeasureAndSetDate = (req: Request, res: Response, next: NextFunction) => {
    const { error } = measureSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    if (!req.body.measure_datetime) {
        const now = DateTime.now().setZone(timeZone);
        req.body.measure_datetime = now.toISO();
    } else {
        const measureDateTime = DateTime.fromISO(req.body.measure_datetime, { zone: timeZone });
        if (!measureDateTime.isValid) {
            return res.status(400).json({ message: 'measure_datetime deve ser uma data válida.' });
        }
        req.body.measure_datetime = measureDateTime.toISO();
    }

    next();
};

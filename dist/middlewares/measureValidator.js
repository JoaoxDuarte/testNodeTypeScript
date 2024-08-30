"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMeasureAndSetDate = void 0;
const joi_1 = __importDefault(require("joi"));
const luxon_1 = require("luxon");
const timeZone = 'America/Sao_Paulo';
const measureSchema = joi_1.default.object({
    uuid: joi_1.default.string().guid().optional(),
    customer_code: joi_1.default.string().min(1).required(),
    imageUrl: joi_1.default.string().required(),
    measure_datetime: joi_1.default.string().isoDate().optional(),
    measure_type: joi_1.default.string().valid('WATER', 'GAS').required(),
    measureValue: joi_1.default.number().optional(),
    hasConfirmed: joi_1.default.boolean().optional()
});
const validateMeasureAndSetDate = (req, res, next) => {
    const { error } = measureSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    if (!req.body.measure_datetime) {
        const now = luxon_1.DateTime.now().setZone(timeZone);
        req.body.measure_datetime = now.toISO();
    }
    else {
        const measureDateTime = luxon_1.DateTime.fromISO(req.body.measure_datetime, { zone: timeZone });
        if (!measureDateTime.isValid) {
            return res.status(400).json({ message: 'measure_datetime deve ser uma data válida.' });
        }
        req.body.measure_datetime = measureDateTime.toISO();
    }
    next();
};
exports.validateMeasureAndSetDate = validateMeasureAndSetDate;

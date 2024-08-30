"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadMeasure = void 0;
const luxon_1 = require("luxon");
class UploadMeasure {
    constructor(measureRepository, geminiService) {
        this.measureRepository = measureRepository;
        this.geminiService = geminiService;
    }
    execute(image, customerCode, measureDateTime, measureType, uuid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(measureDateTime instanceof luxon_1.DateTime)) {
                throw new Error('measureDateTime deve ser um objeto DateTime.');
            }
            const measureDatetimeString = measureDateTime.toISO();
            if (!measureDatetimeString) {
                throw new Error('Falha ao converter measureDateTime para ISO string.');
            }
            const measurement = yield this.geminiService.getMeasurementFromImage(image);
            const measure = {
                uuid,
                customerCode,
                measureDatetime: measureDatetimeString,
                measureType,
                measureValue: measurement,
                hasConfirmed: false
            };
            yield this.measureRepository.saveMeasurement(measure);
            return { sucesso: true, medida: measurement };
        });
    }
}
exports.UploadMeasure = UploadMeasure;

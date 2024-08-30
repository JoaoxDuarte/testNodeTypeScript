import { Measure } from '../domain/Measure';
import { MeasureRepository } from '../infrastructure/repositories/MeasureRepository';
import { GeminiService } from '../infrastructure/services/GeminiService';
import { DateTime } from 'luxon';

export class UploadMeasure {
    constructor(
        private measureRepository: MeasureRepository,
        private geminiService: GeminiService
    ) { }

    async execute(
        image: string,
        customerCode: string,
        measureDateTime: DateTime,
        measureType: 'WATER' | 'GAS',
        uuid: string
    ): Promise<any> {
        if (!(measureDateTime instanceof DateTime)) {
            throw new Error('measureDateTime deve ser um objeto DateTime.');
        }

        const measureDatetimeString = measureDateTime.toISO();

        if (!measureDatetimeString) {
            throw new Error('Falha ao converter measureDateTime para ISO string.');
        }



        const measurement = await this.geminiService.getMeasurementFromImage(image);

        const measure: Measure = {
            uuid,
            customerCode,
            measureDatetime: measureDatetimeString,
            measureType,
            measureValue: measurement,
            hasConfirmed: false
        };

        await this.measureRepository.saveMeasurement(measure);
        return { sucesso: true, medida: measurement };
    }
}
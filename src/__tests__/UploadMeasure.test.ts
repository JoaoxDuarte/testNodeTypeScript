import { UploadMeasure } from '../application/UploadMeasure';
import { MeasureRepository } from '../infrastructure/repositories/MeasureRepository';
import { GeminiService } from '../infrastructure/services/GeminiService';
import { Measure } from '../domain/Measure';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

interface MockGeminiService {
    getMeasurementFromImage: jest.Mock<Promise<number>, [string]>;
}

interface MockMeasureRepository {
    saveMeasurement: jest.Mock<Promise<void>, [Measure]>;
}

describe('UploadMeasure', () => {
    let uploadMeasure: UploadMeasure;
    let mockMeasureRepository: MockMeasureRepository;
    let mockGeminiService: MockGeminiService;

    beforeEach(() => {
        mockMeasureRepository = {
            saveMeasurement: jest.fn(),
        };

        mockGeminiService = {
            getMeasurementFromImage: jest.fn(),
        };

        uploadMeasure = new UploadMeasure(
            mockMeasureRepository as unknown as MeasureRepository,
            mockGeminiService as unknown as GeminiService
        );
    });

    it('deve enviar uma medida e retornar os valores', async () => {
        mockGeminiService.getMeasurementFromImage.mockResolvedValue(123);

        const uuid = uuidv4();
        const measureDatetime = DateTime.now(); //Objeto DateTime do Luxon

        const result = await uploadMeasure.execute(
            'base64image',
            'customerCode',
            measureDatetime,
            'WATER',
            uuid
        );

        expect(result).toEqual({
            sucesso: true,
            medida: 123,
        });

        expect(mockMeasureRepository.saveMeasurement).toHaveBeenCalledWith({
            uuid: expect.any(String),
            customerCode: 'customerCode',
            measureDatetime: expect.any(String),
            measureType: 'WATER',
            measureValue: 123,
            hasConfirmed: false,
        });
    });
});
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
const UploadMeasure_1 = require("../application/UploadMeasure");
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
describe('UploadMeasure', () => {
    let uploadMeasure;
    let mockMeasureRepository;
    let mockGeminiService;
    beforeEach(() => {
        mockMeasureRepository = {
            saveMeasurement: jest.fn(),
        };
        mockGeminiService = {
            getMeasurementFromImage: jest.fn(),
        };
        uploadMeasure = new UploadMeasure_1.UploadMeasure(mockMeasureRepository, mockGeminiService);
    });
    it('deve enviar uma medida e retornar os valores', () => __awaiter(void 0, void 0, void 0, function* () {
        mockGeminiService.getMeasurementFromImage.mockResolvedValue(123);
        const uuid = (0, uuid_1.v4)();
        const measureDatetime = luxon_1.DateTime.now(); //Objeto DateTime do Luxon
        const result = yield uploadMeasure.execute('base64image', 'customerCode', measureDatetime, 'WATER', uuid);
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
    }));
});

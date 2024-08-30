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
exports.MeasureController = void 0;
const uuid_1 = require("uuid");
const luxon_1 = require("luxon");
const timeZone = 'America/Sao_Paulo';
class MeasureController {
    constructor(uploadMeasure, measureRepository) {
        this.uploadMeasure = uploadMeasure;
        this.measureRepository = measureRepository;
    }
    listByCustomerCode(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { customer_code } = req.params;
            const measureTypeQuery = req.query.measure_type;
            let measureType;
            if (measureTypeQuery) {
                if (typeof measureTypeQuery === 'string') {
                    measureType = measureTypeQuery.toUpperCase();
                    if (measureType !== 'WATER' && measureType !== 'GAS') {
                        return res.status(400).json({
                            error_code: 'INVALID_TYPE',
                            error_description: 'Tipo de medição não permitida'
                        });
                    }
                }
                else {
                    return res.status(400).json({
                        error_code: 'INVALID_DATA',
                        error_description: 'Parâmetro measure_type deve ser uma string'
                    });
                }
            }
            try {
                const measures = yield this.measureRepository.findByCustomerCode(customer_code, measureType);
                if (measures.length === 0) {
                    return res.status(404).json({
                        error_code: 'MEASURES_NOT_FOUND',
                        error_description: 'Nenhuma leitura encontrada'
                    });
                }
                const formattedMeasures = measures.map(measure => ({
                    measure_uuid: measure.uuid,
                    measure_datetime: measure.measureDatetime,
                    measure_type: measure.measureType,
                    has_confirmed: measure.hasConfirmed,
                }));
                return res.status(200).json({
                    customer_code,
                    measures: formattedMeasures
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
    upload(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { customer_code, measure_datetime, measure_type, imageUrl } = req.body;
            if (!imageUrl) {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Imagem não fornecida'
                });
            }
            if (!customer_code || !measure_datetime || !measure_type) {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Campos obrigatórios não fornecidos'
                });
            }
            try {
                const measureDateTime = luxon_1.DateTime.fromISO(measure_datetime, { zone: timeZone });
                if (!measureDateTime.isValid) {
                    return res.status(400).json({
                        error_code: 'INVALID_DATA',
                        error_description: 'Data fornecida é inválida'
                    });
                }
                const existingMeasure = yield this.measureRepository.findByMonthAndType(measureDateTime.toJSDate(), measure_type);
                if (existingMeasure) {
                    return res.status(409).json({
                        error_code: 'DOUBLE_REPORT',
                        error_description: 'Leitura do mês já realizada'
                    });
                }
                const uuid = (0, uuid_1.v4)();
                const measurement = yield this.uploadMeasure.execute(imageUrl, customer_code, measureDateTime, measure_type, uuid);
                return res.status(200).json({
                    message: 'Operação realizada com sucesso!',
                    measurement,
                    imageUrl, // IMG na resposta
                    uuid,
                    formattedDate: measureDateTime.toFormat('yyyy-MM-dd HH:mm:ss')
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ message: `Erro ao obter medição da imagem: ${error.message}` });
                }
                else {
                    return res.status(500).json({ message: 'Erro desconhecido' });
                }
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { customer_code, measure_datetime, measure_type, imageUrl } = req.body;
            if (!customer_code || !measure_datetime || !imageUrl) {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Dados incompletos. Verifique os campos obrigatórios.'
                });
            }
            try {
                const measureDatetimeString = luxon_1.DateTime.fromISO(measure_datetime, { zone: timeZone }).toISO() || undefined;
                const updateData = {
                    customerCode: customer_code,
                    measureDatetime: measureDatetimeString,
                    measureType: measure_type,
                    imageUrl: imageUrl,
                };
                yield this.measureRepository.update(id, updateData);
                const updatedMeasure = yield this.measureRepository.findById(id);
                if (updatedMeasure) {
                    const zonedDateTime = luxon_1.DateTime.fromISO(updatedMeasure.measureDatetime, { zone: timeZone });
                    res.status(200).json(Object.assign(Object.assign({}, updatedMeasure), { measureDatetime: zonedDateTime.toFormat('yyyy-MM-dd HH:mm:ss') }));
                }
                else {
                    res.status(404).json({ error: 'Medição não encontrada após atualização' });
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const measures = yield this.measureRepository.findAll();
                res.status(200).json(measures);
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
    findById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const measure = yield this.measureRepository.findById(id);
                if (measure) {
                    const zonedDateTime = luxon_1.DateTime.fromISO(measure.measureDatetime, { zone: timeZone });
                    res.status(200).json(Object.assign(Object.assign({}, measure), { measureDatetime: zonedDateTime.toFormat('yyyy-MM-dd HH:mm:ss') }));
                }
                else {
                    res.status(404).json({ error: 'Medição não encontrada' });
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                yield this.measureRepository.delete(id);
                res.status(200).json({ message: 'Medição excluída com sucesso' });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
    confirm(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { measureValue } = req.body;
            if (typeof measureValue !== 'number' || isNaN(measureValue)) {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Os dados fornecidos no corpo da requisição são inválidos'
                });
            }
            try {
                const measure = yield this.measureRepository.findById(id);
                if (!measure) {
                    return res.status(404).json({
                        error_code: 'MEASURE_NOT_FOUND',
                        error_description: 'Leitura não encontrada'
                    });
                }
                if (measure.hasConfirmed) {
                    return res.status(409).json({
                        error_code: 'CONFIRMATION_DUPLICATE',
                        error_description: 'Leitura já confirmada'
                    });
                }
                yield this.measureRepository.update(id, Object.assign(Object.assign({}, measure), { measureValue, hasConfirmed: true }));
                return res.status(200).json({
                    success: true
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    return res.status(500).json({ error: error.message });
                }
                else {
                    return res.status(500).json({ error: 'Erro desconhecido' });
                }
            }
        });
    }
}
exports.MeasureController = MeasureController;

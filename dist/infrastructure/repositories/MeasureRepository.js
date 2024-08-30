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
exports.MeasureRepository = void 0;
const Measure_1 = require("../../domain/Measure");
const data_source_1 = require("../../data-source");
const luxon_1 = require("luxon");
class MeasureRepository {
    constructor() {
        this.repository = data_source_1.AppDataSource.getRepository(Measure_1.Measure);
    }
    findByCustomerCode(customerCode, measureType) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.repository.createQueryBuilder('measure')
                .where('measure.customerCode = :customerCode', { customerCode });
            if (measureType) {
                query.andWhere('measure.measureType = :measureType', { measureType });
            }
            const measures = yield query.getMany();
            return measures;
        });
    }
    saveMeasurement(measurement) {
        return __awaiter(this, void 0, void 0, function* () {
            if (isNaN(measurement.measureValue)) {
                throw new Error('O valor da medição é inválido');
            }
            if (typeof measurement.measureDatetime !== 'string') {
                throw new Error('measureDatetime deve ser uma string');
            }
            measurement.measureDatetime = luxon_1.DateTime.fromISO(measurement.measureDatetime).toFormat('yyyy-MM-dd HH:mm:ss');
            yield this.repository.save(measurement);
            console.log('Salvando a medida:', measurement);
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Pesquisando todas as medidas...');
            const measures = yield this.repository.find();
            return measures;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Obtendo medição por ID:', id);
            const measure = yield this.repository.findOneBy({ uuid: id });
            return measure;
        });
    }
    update(id, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (updateData.measureDatetime && typeof updateData.measureDatetime !== 'string') {
                throw new Error('measureDatetime deve ser uma string');
            }
            if (updateData.measureDatetime) {
                updateData.measureDatetime = luxon_1.DateTime.fromISO(updateData.measureDatetime).toFormat('yyyy-MM-dd HH:mm:ss');
            }
            const result = yield this.repository.update(id, updateData);
            if (result.affected === 0) {
                throw new Error('Medição não encontrada para atualização');
            }
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.repository.delete(id);
            if (result.affected === 0) {
                throw new Error('Medição não encontrada para exclusão');
            }
        });
    }
    findByMonthAndType(date, measureType) {
        return __awaiter(this, void 0, void 0, function* () {
            const startOfMonth = luxon_1.DateTime.fromJSDate(date).startOf('month').toFormat('yyyy-MM-dd');
            const endOfMonth = luxon_1.DateTime.fromJSDate(date).endOf('month').toFormat('yyyy-MM-dd');
            const measure = yield this.repository.createQueryBuilder('measure')
                .where('measure.measureType = :measureType', { measureType })
                .andWhere('measure.measureDatetime BETWEEN :startOfMonth AND :endOfMonth', { startOfMonth, endOfMonth })
                .getOne();
            return measure;
        });
    }
}
exports.MeasureRepository = MeasureRepository;

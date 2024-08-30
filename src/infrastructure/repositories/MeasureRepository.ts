import { Repository } from 'typeorm';
import { Measure } from '../../domain/Measure';
import { MeasureUpdateData } from '../../interfaces/MeasureUpdateData';
import { AppDataSource } from '../../data-source';
import { DateTime } from 'luxon';

export class MeasureRepository {
    private repository: Repository<Measure>;

    constructor() {
        this.repository = AppDataSource.getRepository(Measure);
    }

    async findByCustomerCode(customerCode: string, measureType?: 'WATER' | 'GAS'): Promise<Measure[]> {
        const query = this.repository.createQueryBuilder('measure')
            .where('measure.customerCode = :customerCode', { customerCode });

        if (measureType) {
            query.andWhere('measure.measureType = :measureType', { measureType });
        }

        const measures = await query.getMany();
        return measures;
    }


    async saveMeasurement(measurement: Measure): Promise<void> {
        if (isNaN(measurement.measureValue)) {
            throw new Error('O valor da medição é inválido');
        }

        if (typeof measurement.measureDatetime !== 'string') {
            throw new Error('measureDatetime deve ser uma string');
        }

        measurement.measureDatetime = DateTime.fromISO(measurement.measureDatetime).toFormat('yyyy-MM-dd HH:mm:ss');

        await this.repository.save(measurement);
        console.log('Salvando a medida:', measurement);
    }

    async findAll(): Promise<Measure[]> {
        console.log('Pesquisando todas as medidas...');
        const measures = await this.repository.find();
        return measures;
    }

    async findById(id: string): Promise<Measure | null> {
        console.log('Obtendo medição por ID:', id);
        const measure = await this.repository.findOneBy({ uuid: id });
        return measure;
    }

    async update(id: string, updateData: MeasureUpdateData): Promise<void> {
        if (updateData.measureDatetime && typeof updateData.measureDatetime !== 'string') {
            throw new Error('measureDatetime deve ser uma string');
        }

        if (updateData.measureDatetime) {
            updateData.measureDatetime = DateTime.fromISO(updateData.measureDatetime).toFormat('yyyy-MM-dd HH:mm:ss');
        }

        const result = await this.repository.update(id, updateData);
        if (result.affected === 0) {
            throw new Error('Medição não encontrada para atualização');
        }
    }

    async delete(id: string): Promise<void> {
        const result = await this.repository.delete(id);
        if (result.affected === 0) {
            throw new Error('Medição não encontrada para exclusão');
        }
    }

    async findByMonthAndType(date: Date, measureType: 'WATER' | 'GAS'): Promise<Measure | null> {
        const startOfMonth = DateTime.fromJSDate(date).startOf('month').toFormat('yyyy-MM-dd');
        const endOfMonth = DateTime.fromJSDate(date).endOf('month').toFormat('yyyy-MM-dd');

        const measure = await this.repository.createQueryBuilder('measure')
            .where('measure.measureType = :measureType', { measureType })
            .andWhere('measure.measureDatetime BETWEEN :startOfMonth AND :endOfMonth', { startOfMonth, endOfMonth })
            .getOne();

        return measure;
    }
}

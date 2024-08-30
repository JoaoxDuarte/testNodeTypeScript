import { Request, Response } from 'express';
import { UploadMeasure } from '../../application/UploadMeasure';
import { MeasureRepository } from '../repositories/MeasureRepository';
import { MeasureUpdateData } from '../../interfaces/MeasureUpdateData';
import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';

const timeZone = 'America/Sao_Paulo';

export class MeasureController {
    constructor(
        private uploadMeasure: UploadMeasure,
        private measureRepository: MeasureRepository
    ) { }

    async listByCustomerCode(req: Request, res: Response) {
        const { customer_code } = req.params;
        const measureTypeQuery = req.query.measure_type;

        let measureType: 'WATER' | 'GAS' | undefined;
        if (measureTypeQuery) {
            if (typeof measureTypeQuery === 'string') {
                measureType = measureTypeQuery.toUpperCase() as 'WATER' | 'GAS';
                if (measureType !== 'WATER' && measureType !== 'GAS') {
                    return res.status(400).json({
                        error_code: 'INVALID_TYPE',
                        error_description: 'Tipo de medição não permitida'
                    });
                }
            } else {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Parâmetro measure_type deve ser uma string'
                });
            }
        }

        try {
            const measures = await this.measureRepository.findByCustomerCode(customer_code, measureType);

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
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }

    async upload(req: Request, res: Response) {
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
            const measureDateTime = DateTime.fromISO(measure_datetime, { zone: timeZone });
            if (!measureDateTime.isValid) {
                return res.status(400).json({
                    error_code: 'INVALID_DATA',
                    error_description: 'Data fornecida é inválida'
                });
            }

            const existingMeasure = await this.measureRepository.findByMonthAndType(measureDateTime.toJSDate(), measure_type);
            if (existingMeasure) {
                return res.status(409).json({
                    error_code: 'DOUBLE_REPORT',
                    error_description: 'Leitura do mês já realizada'
                });
            }

            const uuid = uuidv4();

            const measurement = await this.uploadMeasure.execute(imageUrl, customer_code, measureDateTime, measure_type, uuid);

            return res.status(200).json({
                message: 'Operação realizada com sucesso!',
                measurement,
                imageUrl, // IMG na resposta
                uuid,
                formattedDate: measureDateTime.toFormat('yyyy-MM-dd HH:mm:ss')
            });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ message: `Erro ao obter medição da imagem: ${error.message}` });
            } else {
                return res.status(500).json({ message: 'Erro desconhecido' });
            }
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { customer_code, measure_datetime, measure_type, imageUrl } = req.body;

        if (!customer_code || !measure_datetime || !imageUrl) {
            return res.status(400).json({
                error_code: 'INVALID_DATA',
                error_description: 'Dados incompletos. Verifique os campos obrigatórios.'
            });
        }

        try {
            const measureDatetimeString = DateTime.fromISO(measure_datetime, { zone: timeZone }).toISO() || undefined;

            const updateData: MeasureUpdateData = {
                customerCode: customer_code,
                measureDatetime: measureDatetimeString,
                measureType: measure_type,
                imageUrl: imageUrl,
            };

            await this.measureRepository.update(id, updateData);
            const updatedMeasure = await this.measureRepository.findById(id);
            if (updatedMeasure) {
                const zonedDateTime = DateTime.fromISO(updatedMeasure.measureDatetime, { zone: timeZone });
                res.status(200).json({
                    ...updatedMeasure,
                    measureDatetime: zonedDateTime.toFormat('yyyy-MM-dd HH:mm:ss')
                });
            } else {
                res.status(404).json({ error: 'Medição não encontrada após atualização' });
            }
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }

    async list(req: Request, res: Response) {
        try {
            const measures = await this.measureRepository.findAll();
            res.status(200).json(measures);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }

    async findById(req: Request, res: Response) {
        const { id } = req.params;

        try {
            const measure = await this.measureRepository.findById(id);
            if (measure) {
                const zonedDateTime = DateTime.fromISO(measure.measureDatetime, { zone: timeZone });
                res.status(200).json({
                    ...measure,
                    measureDatetime: zonedDateTime.toFormat('yyyy-MM-dd HH:mm:ss')
                });
            } else {
                res.status(404).json({ error: 'Medição não encontrada' });
            }
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        try {
            await this.measureRepository.delete(id);
            res.status(200).json({ message: 'Medição excluída com sucesso' });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }


    async confirm(req: Request, res: Response) {
        const { id } = req.params;
        const { measureValue } = req.body;

        if (typeof measureValue !== 'number' || isNaN(measureValue)) {
            return res.status(400).json({
                error_code: 'INVALID_DATA',
                error_description: 'Os dados fornecidos no corpo da requisição são inválidos'
            });
        }

        try {
            const measure = await this.measureRepository.findById(id);
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

            await this.measureRepository.update(id, {
                ...measure,
                measureValue,
                hasConfirmed: true
            });

            return res.status(200).json({
                success: true
            });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: error.message });
            } else {
                return res.status(500).json({ error: 'Erro desconhecido' });
            }
        }
    }
}

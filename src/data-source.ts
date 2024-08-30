import { DataSource } from 'typeorm';
import path from 'path';
import { Measure } from './domain/Measure';
import { entities } from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'database',
  synchronize: true,
  logging: true,
  entities: [Measure],
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Banco de dados conectando...');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados', error);
  }
}
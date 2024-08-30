import dotenv from 'dotenv';
dotenv.config();

export const config = {
    API_KEY: process.env.API_KEY || '',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '5432',
    DB_USERNAME: process.env.DB_USERNAME || 'postgres',
    DB_PASSWORD: process.env.DB_PASSWORD || '123',
    DB_NAME: process.env.DB_NAME || 'database',
};
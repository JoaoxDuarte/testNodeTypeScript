"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const typeorm_1 = require("typeorm");
async function initializeDatabase() {
    try {
        await (0, typeorm_1.createConnection)();
        console.log('Banco de dados conectado com sucesso!');
    }
    catch (error) {
        console.error('Erro ao conectar ao banco de dados', error);
    }
}

import app from './app';
import path from 'path';
import { initializeDatabase, AppDataSource } from './data-source';

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await initializeDatabase();
        console.log('Banco de dados conectado!');
        console.log('Caminho das entidades:', path.join(__dirname, '/domain/*.ts'));
        console.log('Entidades carregadas:', AppDataSource.entityMetadatas.map(entity => entity.name));
        app.listen(port, () => {
            console.log(`Servidor sendo executado na porta: ${port}`);
        });
    } catch (error) {
        console.error('Falha ao executar o servidor:', error);
    }
}

startServer();
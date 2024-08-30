import express from 'express';
import * as dotenv from 'dotenv';
import routes from './infrastructure/routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Está funcionando!');
});


export default app;
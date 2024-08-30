import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Inicializa o Gemini com a chave da API
const genAI = new GoogleGenerativeAI(config.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const fileManager = new GoogleAIFileManager(config.API_KEY);

// Cria o diretório temp (para arquivos temporários) se não existir
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Função para salvar a imagem base64 temporáriamente
async function saveBase64Image(base64Image: string, format: 'jpeg' | 'png' = 'png'): Promise<string> {
    const base64Data = base64Image.split(',')[1];
    if (!base64Data) {
        throw new Error('Dados base64 da imagem estão faltando.');
    }
    const fileName = `${uuidv4()}.${format}`;
    const filePath = path.join(tempDir, fileName);
    try {
        fs.writeFileSync(filePath, base64Data, 'base64');
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Erro ao salvar a imagem: ${error.message}`);
        } else {
            throw new Error('Erro ao salvar a imagem: Erro desconhecido');
        }
    }
    return filePath;
}

export async function uploadFile(filePath: string, mimeType: string, displayName: string) {
    const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType,
        displayName
    });
    console.log('Resposta do upload:', uploadResponse); // Depuração
    return uploadResponse.file.uri;
}

export async function checkFileState(fileName: string) {
    let file = await fileManager.getFile(fileName);
    while (file.state === FileState.PROCESSING) {
        console.log('Carregando...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        file = await fileManager.getFile(fileName);
    }
    if (file.state === FileState.FAILED) {
        throw new Error('O processamento do arquivo falhou.');
    }
    return file.uri;
}

// Função para gerar conteúdo da API
export async function generateContent(fileUri: string, textCommand: string): Promise<string> {
    const result = await model.generateContent([
        {
            fileData: {
                mimeType: 'image/jpeg',
                fileUri
            }
        },
        { text: textCommand }
    ]);
    const responseText = result.response.text();
    return responseText;
}

export class GeminiService {
    private model: any;

    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async processImage(base64Image: string, format: 'jpeg' | 'png' = 'png'): Promise<any> {
        try {
            const filePath = await saveBase64Image(base64Image, format);
            const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
            const fileUri = await uploadFile(filePath, mimeType, 'image');
            const textCommand = 'Extrair o número da imagem';
            const result = await generateContent(fileUri, textCommand);
            return result;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Erro ao processar a imagem: ${error.message}`);
            } else {
                throw new Error('Erro ao processar a imagem: Erro desconhecido');
            }
        }
    }

    async getMeasurementFromImage(base64Image: string, format: 'jpeg' | 'png' = 'png'): Promise<number> {
        try {
            const result = await this.processImage(base64Image, format);
            console.log('Resultado da API:', result); // RESULTADO / PRINT

            // Extrair o número da resposta
            const match = result.match(/\b\d+\b/);
            if (match) {
                const measurement = parseFloat(match[0]);
                if (!isNaN(measurement)) {
                    return measurement;
                }
            }

            throw new Error('O valor da medição extraído é inválido.');
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Falha ao recuperar a medição da imagem: ${error.message}`);
            } else {
                throw new Error('Falha ao recuperar a medição da imagem: Erro desconhecido');
            }
        }
    }
}
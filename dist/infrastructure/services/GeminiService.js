"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.GeminiService = void 0;
exports.uploadFile = uploadFile;
exports.checkFileState = checkFileState;
exports.generateContent = generateContent;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../../config");
const server_1 = require("@google/generative-ai/server");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
// Inicializa o Gemini com a chave da API
const genAI = new generative_ai_1.GoogleGenerativeAI(config_1.config.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const fileManager = new server_1.GoogleAIFileManager(config_1.config.API_KEY);
// Cria o diretório temp (para arquivos temporários) se não existir
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}
// Função para salvar a imagem base64 temporáriamente
function saveBase64Image(base64Image_1) {
    return __awaiter(this, arguments, void 0, function* (base64Image, format = 'png') {
        const base64Data = base64Image.split(',')[1];
        if (!base64Data) {
            throw new Error('Dados base64 da imagem estão faltando.');
        }
        const fileName = `${(0, uuid_1.v4)()}.${format}`;
        const filePath = path.join(tempDir, fileName);
        try {
            fs.writeFileSync(filePath, base64Data, 'base64');
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Erro ao salvar a imagem: ${error.message}`);
            }
            else {
                throw new Error('Erro ao salvar a imagem: Erro desconhecido');
            }
        }
        return filePath;
    });
}
function uploadFile(filePath, mimeType, displayName) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadResponse = yield fileManager.uploadFile(filePath, {
            mimeType,
            displayName
        });
        console.log('Resposta do upload:', uploadResponse); // Depuração
        return uploadResponse.file.uri;
    });
}
function checkFileState(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        let file = yield fileManager.getFile(fileName);
        while (file.state === server_1.FileState.PROCESSING) {
            console.log('Carregando...');
            yield new Promise(resolve => setTimeout(resolve, 10000));
            file = yield fileManager.getFile(fileName);
        }
        if (file.state === server_1.FileState.FAILED) {
            throw new Error('O processamento do arquivo falhou.');
        }
        return file.uri;
    });
}
// Função para gerar conteúdo da API
function generateContent(fileUri, textCommand) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield model.generateContent([
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
    });
}
class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    processImage(base64Image_1) {
        return __awaiter(this, arguments, void 0, function* (base64Image, format = 'png') {
            try {
                const filePath = yield saveBase64Image(base64Image, format);
                const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
                const fileUri = yield uploadFile(filePath, mimeType, 'image');
                const textCommand = 'Extrair o número da imagem';
                const result = yield generateContent(fileUri, textCommand);
                return result;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Erro ao processar a imagem: ${error.message}`);
                }
                else {
                    throw new Error('Erro ao processar a imagem: Erro desconhecido');
                }
            }
        });
    }
    getMeasurementFromImage(base64Image_1) {
        return __awaiter(this, arguments, void 0, function* (base64Image, format = 'png') {
            try {
                const result = yield this.processImage(base64Image, format);
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
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new Error(`Falha ao recuperar a medição da imagem: ${error.message}`);
                }
                else {
                    throw new Error('Falha ao recuperar a medição da imagem: Erro desconhecido');
                }
            }
        });
    }
}
exports.GeminiService = GeminiService;

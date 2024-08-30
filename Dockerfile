FROM node:20-buster

# Instale pacotes necessários
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Crie o diretório de trabalho
WORKDIR /usr/src/app

# Copie o package.json e package-lock.json
COPY package*.json ./

# Instale as dependências do Node.js
RUN npm install

# Copie os arquivos do projeto
COPY . .

# Compile o TypeScript
RUN npm run build

# Exponha a porta que o app irá rodar
EXPOSE 3000

# Comando para iniciar o aplicativo
CMD ["node", "dist/index.js"]
FROM node:20

# Crear directorio de la aplicación
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copiar package.json y yarn.lock
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install

# Copiar el código fuente
COPY . .

# Compilar la aplicación
RUN yarn build

# Exponer puerto
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "dist/main.js"]
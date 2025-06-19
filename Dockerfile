# 1. Imagen base con Node
FROM node:20-alpine

# 2. Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar archivos de definición
COPY package*.json ./

# 4. Instalar dependencias
RUN npm install

# 5. Copiar el resto de la app
COPY . .

# 6. Exponer el puerto (ajústalo si usas otro)
EXPOSE 3000

# 7. Comando por defecto (modo desarrollo)
CMD ["npm", "run", "start:dev"]

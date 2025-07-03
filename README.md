# 💬 Chat en Tiempo Real - NestJS

Un sistema de chat en tiempo real desarrollado con **NestJS** y **Socket.IO**, que permite comunicación instantánea entre usuarios a través de mensajes privados, broadcast y salas de chat.

## 🌐 Demo en Vivo

### 🚀 Aplicación Frontend
**URL**: [https://websocket-arena.netlify.app/](https://websocket-arena.netlify.app/)
- **Plataforma**: Netlify
- **Tecnologías**: HTML, JavaScript Vanilla, CSS, Bootstrap
- **Características**: 
  - Interfaz colorida e intuitiva
  - Notificaciones con SweetAlert
  - Consultas HTTP con Axios
  - Diseño responsive con Bootstrap

### 🔧 Backend API
**URL**: [https://chat-app-f58n.onrender.com/](https://chat-app-f58n.onrender.com/)
- **Plataforma**: Render
- **Endpoint de salud**: `GET /ping` (retorna "pong")
- **WebSocket**: Socket.IO configurado para tiempo real

> **Nota**: El backend puede tardar unos segundos en responder la primera vez debido a que Render pone en reposo los servicios gratuitos por inactividad.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Mensajes Privados**: Comunicación directa entre usuarios
- **Broadcast**: Envío de mensajes a todos los usuarios conectados
- **Sistema de Salas**: Creación y gestión de salas de chat
- **Salas Privadas**: Salas protegidas con contraseña
- **Gestión de Usuarios**: Registro y seguimiento de usuarios conectados
- **Notificaciones del Sistema**: Alertas automáticas de eventos

### 🏠 Gestión de Salas
- Crear salas públicas y privadas
- Unirse a salas existentes
- Listar salas públicas disponibles
- Ver miembros de una sala
- Salir de salas automáticamente al desconectarse

## 🛠️ Tecnologías Utilizadas

### Backend
- **[NestJS](https://nestjs.com/)** - Framework de Node.js
- **[Socket.IO](https://socket.io/)** - Comunicación en tiempo real
- **[TypeScript](https://www.typescriptlang.org/)** - Lenguaje de programación
- **[Docker](https://www.docker.com/)** - Containerización

### Frontend
- **HTML5** - Estructura del aplicativo
- **JavaScript Vanilla** - Lógica del cliente
- **CSS3** - Estilos personalizados
- **[Bootstrap](https://getbootstrap.com/)** - Framework CSS
- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[SweetAlert](https://sweetalert.js.org/)** - Notificaciones elegantes

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Docker y Docker Compose (opcional)

## 🚀 Instalación y Uso

### Método 1: Instalación Local

```bash
# Clonar el repositorio del backend
git clone https://github.com/Marux/chat-app.git
cd chat-app

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run start:dev

# El servidor estará disponible en http://localhost:3000
```

### Método 2: Docker (Recomendado)

```bash
# Clonar el repositorio del backend
git clone https://github.com/Marux/chat-app.git
cd chat-app

# Construir y ejecutar con Docker Compose
docker-compose up --build

# El servidor estará disponible en http://localhost:3000
```

## 🌐 Configuración de Despliegue

### Backend (Render)
```typescript
// main.ts - Configuración de CORS para producción
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: ['https://websocket-arena.netlify.app'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

### Endpoint de Salud
```typescript
// Controlador ping para mantener activo el servidor
@Get('ping')
ping() {
  return 'pong';
}
```

### Frontend (Netlify)
El frontend se conecta automáticamente al backend desplegado en Render:
```javascript
// Configuración del cliente Socket.IO
const socket = io('https://chat-app-f58n.onrender.com/');
```

## 📡 API de WebSocket

### Eventos del Cliente → Servidor

#### 👤 Gestión de Usuarios
```javascript
// Registrar usuario
socket.emit('register', 'nombreUsuario');
```

#### 💬 Mensajería
```javascript
// Mensaje privado
socket.emit('send-to-user', {
  toUserId: 'destinatario',
  message: 'Hola!'
});

// Mensaje broadcast
socket.emit('send-to-all', 'Mensaje para todos');

// Mensaje a sala
socket.emit('send-to-room', {
  room: 'nombreSala',
  message: 'Hola sala!'
});
```

#### 🏠 Gestión de Salas
```javascript
// Crear sala
socket.emit('create-room', {
  name: 'miSala',
  isPrivate: false,
  password: 'opcional'
});

// Unirse a sala
socket.emit('join-room', {
  room: 'nombreSala',
  password: 'opcional'
});

// Salir de sala
socket.emit('leave-room', 'nombreSala');

// Listar salas públicas
socket.emit('list-rooms');

// Ver miembros de sala
socket.emit('room-members', 'nombreSala');
```

### Eventos del Servidor → Cliente

#### 📨 Mensajes Recibidos
```javascript
// Mensaje privado recibido
socket.on('private-message', (data) => {
  console.log(`De ${data.from}: ${data.message}`);
});

// Mensaje broadcast recibido
socket.on('broadcast-message', (data) => {
  console.log(`Broadcast de ${data.from}: ${data.message}`);
});

// Mensaje de sala recibido
socket.on('room-message', (data) => {
  console.log(`[${data.room}] ${data.from}: ${data.message}`);
});
```

#### 🏠 Eventos de Salas
```javascript
// Confirmación de unión a sala
socket.on('room-joined', (data) => {
  console.log(data.message);
  console.log('Info de la sala:', data.roomInfo);
});

// Lista de salas públicas
socket.on('room-list', (rooms) => {
  console.log('Salas disponibles:', rooms);
});

// Lista de miembros de sala
socket.on('room-members-list', (data) => {
  console.log(`Miembros de ${data.room}:`, data.members);
});

// Notificaciones de sala
socket.on('room-notification', (data) => {
  console.log(`[${data.room}] ${data.message}`);
});
```

## 📁 Estructura del Proyecto

### Backend
```
├── src/
│   ├── chat/
│   │   └── chat.gateway.ts    # Gateway principal de WebSocket
│   ├── app.controller.ts      # Controlador con endpoint ping
│   ├── app.module.ts          # Módulo principal
│   └── main.ts               # Punto de entrada con CORS
├── docker-compose.yml        # Configuración de Docker
├── Dockerfile               # Imagen de Docker
└── README.md               # Este archivo
```

### Frontend (Repositorio Separado)
```
├── index.html              # Página principal
├── css/
│   └── styles.css         # Estilos personalizados
├── js/
│   └── app.js            # Lógica del cliente
└── assets/               # Recursos estáticos
```

## 🔧 Configuración

### Variables de Entorno
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://websocket-arena.netlify.app
```

### Docker Compose
El proyecto incluye una configuración de Docker Compose que:
- Expone el puerto 3000
- Monta el código fuente para desarrollo en caliente
- Configura el entorno de desarrollo

## 🎯 Casos de Uso

### Ejemplo: Cliente de Chat Básico
```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Cliente</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-4">
        <div id="messages" class="mb-3"></div>
        <div class="input-group">
            <input id="messageInput" type="text" class="form-control" placeholder="Escribe tu mensaje...">
            <button class="btn btn-primary" onclick="sendMessage()">Enviar</button>
        </div>
    </div>

    <script>
        const socket = io('https://chat-app-f58n.onrender.com/');
        
        // Registrar usuario
        socket.emit('register', 'usuario123');
        
        // Escuchar mensajes
        socket.on('room-message', (data) => {
            const messages = document.getElementById('messages');
            messages.innerHTML += `
                <div class="alert alert-info">
                    <b>${data.from}:</b> ${data.message}
                </div>
            `;
        });
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (input.value.trim()) {
                socket.emit('send-to-room', {
                    room: 'general',
                    message: input.value
                });
                input.value = '';
            }
        }
        
        // Enviar mensaje con Enter
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## 🚦 Estados y Códigos de Error

### Errores Comunes
- `Usuario destino no conectado` - El destinatario no está en línea
- `La sala no existe` - Intentando acceder a una sala inexistente
- `Contraseña incorrecta` - Credenciales inválidas para sala privada
- `Ya estás en esta sala` - Intento de unirse a una sala donde ya está el usuario

### Consideraciones de Despliegue
- **Render**: El servicio gratuito se pone en reposo después de 15 minutos de inactividad
- **Netlify**: Despliegue automático desde el repositorio Git
- **CORS**: Configurado específicamente para el dominio del frontend

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Victor Trimpai - [@Marux](https://github.com/Marux)

Enlaces del Proyecto:
- **Backend**: [https://github.com/Marux/chat-app](https://github.com/Marux/chat-app)
- **Demo en Vivo**: [https://websocket-arena.netlify.app/](https://websocket-arena.netlify.app/)

## 🙏 Reconocimientos

- [NestJS](https://nestjs.com/) por el excelente framework
- [Socket.IO](https://socket.io/) por la comunicación en tiempo real
- [Bootstrap](https://getbootstrap.com/) por el framework CSS
- [Netlify](https://www.netlify.com/) por el hosting del frontend
- [Render](https://render.com/) por el hosting del backend

---

⭐ ¡No olvides dar una estrella al proyecto si te ha sido útil!

🎉 **¡Proyecto desplegado y funcionando en producción!**

# 💬 Chat en Tiempo Real - NestJS

Un sistema de chat en tiempo real desarrollado con **NestJS** y **Socket.IO**, que permite comunicación instantánea entre usuarios a través de mensajes privados, broadcast y salas de chat.

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

- **[NestJS](https://nestjs.com/)** - Framework de Node.js
- **[Socket.IO](https://socket.io/)** - Comunicación en tiempo real
- **[TypeScript](https://www.typescriptlang.org/)** - Lenguaje de programación
- **[Docker](https://www.docker.com/)** - Containerización

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn
- Docker y Docker Compose (opcional)

## 🚀 Instalación y Uso

### Método 1: Instalación Local

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd chat-nestjs

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run start:dev

# El servidor estará disponible en http://localhost:3000
```

### Método 2: Docker (Recomendado)

```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd chat-nestjs

# Construir y ejecutar con Docker Compose
docker-compose up --build

# El servidor estará disponible en http://localhost:3000
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

```
├── src/
│   ├── chat/
│   │   └── chat.gateway.ts    # Gateway principal de WebSocket
│   ├── app.module.ts          # Módulo principal
│   └── main.ts               # Punto de entrada
├── docker-compose.yml        # Configuración de Docker
├── Dockerfile               # Imagen de Docker
└── README.md               # Este archivo
```

## 🔧 Configuración

### Variables de Entorno
```env
NODE_ENV=development
PORT=3000
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
</head>
<body>
    <div id="messages"></div>
    <input id="messageInput" type="text" placeholder="Escribe tu mensaje...">
    <button onclick="sendMessage()">Enviar</button>

    <script>
        const socket = io('http://localhost:3000');
        
        // Registrar usuario
        socket.emit('register', 'usuario123');
        
        // Escuchar mensajes
        socket.on('room-message', (data) => {
            const messages = document.getElementById('messages');
            messages.innerHTML += `<p><b>${data.from}:</b> ${data.message}</p>`;
        });
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            socket.emit('send-to-room', {
                room: 'general',
                message: input.value
            });
            input.value = '';
        }
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

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Tu Nombre - [@tu_usuario](https://github.com/tu_usuario)

Enlace del Proyecto: [https://github.com/tu_usuario/chat-nestjs](https://github.com/tu_usuario/chat-nestjs)

## 🙏 Reconocimientos

- [NestJS](https://nestjs.com/) por el excelente framework
- [Socket.IO](https://socket.io/) por la comunicación en tiempo real
- La comunidad de desarrolladores por su apoyo

---

⭐ ¡No olvides dar una estrella al proyecto si te ha sido útil!
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
      👀 ¡Eh tú! Sí, tú... el curioso que llegó hasta aquí.
      Este microservicio no tiene Swagger... 
      porque la verdadera magia sucede por WebSocket. 🧙‍♂️⚡

      🔌 Conéctate por Socket.IO, susurra un "hola" y verás lo que pasa...

      🤫 PD: Si estás esperando una API REST... mejor siéntate, relájate y disfruta del show.
    `;
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  obtenerEstado() {
    return {
      mensaje: 'RUTERO',
    };
  }
}

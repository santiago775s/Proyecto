import { PartialType } from '@nestjs/swagger';
import { CrearRutaDto } from './crear-ruta.dto.js';

export class ActualizarRutaDto extends PartialType(CrearRutaDto) {}

import { PartialType } from '@nestjs/swagger';
import { CrearLugarDto } from './crear-lugar.dto.js';

export class ActualizarLugarDto extends PartialType(CrearLugarDto) {}

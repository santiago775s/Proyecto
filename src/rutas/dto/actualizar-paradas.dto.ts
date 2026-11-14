import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { ParadaRutaDto } from './parada-ruta.dto.js';

export class ActualizarParadasDto {
  @ApiProperty({ type: [ParadaRutaDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParadaRutaDto)
  paradas!: ParadaRutaDto[];
}

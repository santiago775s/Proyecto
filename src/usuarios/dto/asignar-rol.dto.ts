import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

const ROLES = ['USUARIO', 'LOCAL', 'ADMIN'] as const;
export type NombreRol = (typeof ROLES)[number];

export class AsignarRolDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  rol!: NombreRol;

  @ApiPropertyOptional({ description: 'Obligatorio al asignar el rol LOCAL' })
  @ValidateIf((datos: AsignarRolDto) => datos.rol === 'LOCAL')
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lugarId?: number;
}

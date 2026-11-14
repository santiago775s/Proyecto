import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ArrayMinSize,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearRecompensaDto {
  @ApiProperty({ maxLength: 120, example: 'Alfajor de Sucre' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ minimum: 1, maximum: 100, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porcentaje = 10;

  @ApiProperty({ required: false, maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  producto?: string;

  @ApiProperty({ minimum: 1, default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  diasVigencia = 30;

  @ApiProperty({ required: false, type: [Number], example: [1, 2] })
  @Type(() => Number)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  lugarIds?: number[];
}

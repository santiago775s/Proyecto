import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaLugar } from '../enums/categoria-lugar.enum.js';

export class CrearLugarDto {
  @ApiProperty({ maxLength: 80, example: 'Chocolates para ti' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre!: string;

  @ApiProperty({ enum: CategoriaLugar, example: CategoriaLugar.TIPICA })
  @IsEnum(CategoriaLugar)
  categoria!: CategoriaLugar;

  @ApiProperty({ maxLength: 150, example: 'Sucre, Chuquisaca' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  direccion!: string;

  @ApiProperty({
    maxLength: 250,
    example: 'Chocolate artesanal y productos locales.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  descripcion!: string;
}

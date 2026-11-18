import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ValorarLugarDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 4 })
  @IsInt()
  @Min(1)
  @Max(5)
  estrellas!: number;
}

import { IsIn, IsOptional } from 'class-validator';
import { PaginacionDto } from '../../common/dto/paginacion.dto.js';
import { CategoriaLugar } from '../enums/categoria-lugar.enum.js';

export class FiltrarLugaresDto extends PaginacionDto {
  @IsOptional()
  @IsIn(Object.values(CategoriaLugar))
  categoria?: CategoriaLugar;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orden?: 'asc' | 'desc' = 'asc';
}

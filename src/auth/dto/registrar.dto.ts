import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const ROLES_REGISTRABLES = ['USUARIO', 'LOCAL'] as const;
export type RolRegistrable = (typeof ROLES_REGISTRABLES)[number];

export class RegistrarDto {
  @ApiProperty({ maxLength: 254, example: 'turista@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 72, example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    enum: ROLES_REGISTRABLES,
    default: 'USUARIO',
    description: 'ADMIN no se puede seleccionar durante el registro',
  })
  @IsOptional()
  @IsIn(ROLES_REGISTRABLES)
  rol?: RolRegistrable;
}

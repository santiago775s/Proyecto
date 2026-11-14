import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ maxLength: 254, example: 'turista@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 12, maxLength: 72, example: 'MiClaveSegura123' })
  @IsString()
  @MinLength(12)
  @MaxLength(72)
  password!: string;
}

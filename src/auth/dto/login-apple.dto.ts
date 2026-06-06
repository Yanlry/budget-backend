import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginAppleDto {
  @IsString()
  @MaxLength(5000)
  identityToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }) =>
    value == null ? undefined : String(value).trim().toLowerCase(),
  )
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) =>
    value == null ? undefined : String(value).trim(),
  )
  fullName?: string;
}

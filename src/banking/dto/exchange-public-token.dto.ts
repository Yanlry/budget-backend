import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ExchangePublicTokenDto {
  @IsString()
  @MinLength(10)
  publicToken!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  syncNow?: boolean;
}

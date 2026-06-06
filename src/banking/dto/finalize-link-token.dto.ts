import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class FinalizeLinkTokenDto {
  @IsString()
  @MinLength(12)
  linkToken!: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  syncNow?: boolean;
}

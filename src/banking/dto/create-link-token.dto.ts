import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateLinkTokenDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(730)
  daysRequested?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hostedLink?: boolean;
}

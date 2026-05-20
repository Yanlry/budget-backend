import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (value == null ? undefined : Number(value)))
  @IsNumber()
  currentBalance?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === '' ? undefined : Number(value),
  )
  @IsNumber()
  @Min(0)
  goalAmount?: number;
}

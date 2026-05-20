import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, {
    message: 'La couleur doit etre un code hex valide, par exemple #BA7941.',
  })
  color?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentBalance?: number;
}

import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';

const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/;

export class RegisterPushTokenDto {
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => String(value ?? '').trim())
  @Matches(EXPO_PUSH_TOKEN_PATTERN, {
    message: 'Token push Expo invalide.',
  })
  token!: string;
}

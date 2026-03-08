import { Profile } from '../../entities/profile.entity';
import { TokenPair } from './tokenPair.dto';

export class RegistrationResponseDto {
  profile: Profile;
  tokenPair: TokenPair;
}

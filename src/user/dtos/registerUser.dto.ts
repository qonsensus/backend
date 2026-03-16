import { IRegisterUser } from '@skostadinov0141/quonsensus-core';

export class RegisterUserDto implements IRegisterUser {
  email: string;
  password: string;
  passwordConfirmation: string;
}

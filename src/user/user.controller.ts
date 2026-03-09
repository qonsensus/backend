import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { RegistrationResponseDto } from '../auth/dtos/registrationResponse.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Register a new user.
   *
   * @remarks This endpoint allows clients to register a new user by providing an email and password. The password must be confirmed by including a matching password confirmation field. If the registration is successful, the newly created user entity is returned.
   * @throws {400} Bad Request - If the password and confirmation do not match, or if the email is already in use.
   */
  @Post()
  @Public()
  async registerUser(
    @Body() dto: RegisterUserDto,
  ): Promise<RegistrationResponseDto> {
    return this.userService.registerUser(dto);
  }
}

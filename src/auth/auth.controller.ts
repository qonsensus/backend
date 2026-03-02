import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { AuthService } from './auth.service';
import { RefreshDto } from './dtos/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: AuthService) {}

  /**
   * Handles user login by accepting login credentials and returning JWT tokens.
   * @remarks This endpoint accepts a POST request with the user's email and password, validates the credentials, and returns an access token, refresh token, and expiration time if the login is successful.
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if the credentials are invalid.
   * @param loginDto - The data transfer object containing the user's email and password.
   * @returns A promise that resolves to a TokenPair containing the access token, refresh token, and expiration time.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  /**
   * Handles token refresh by accepting a refresh token and returning new JWT tokens.
   * @remarks This endpoint accepts a POST request with a refresh token, validates the token, and returns a new access token, new refresh token, and expiration time if the token is valid.
   * @throws BadRequestException if the refresh token is invalid or if the token type is incorrect.
   * @throws NotFoundException if the user associated with the token is not found.
   * @param refreshDto - The data transfer object containing the refresh token.
   * @returns A promise that resolves to a TokenPair containing the new access token, new refresh token, and expiration time.
   */
  @Post('refresh')
  async refreshToken(@Body() refreshDto: RefreshDto) {
    return this.userService.refreshToken(refreshDto.refreshToken);
  }
}

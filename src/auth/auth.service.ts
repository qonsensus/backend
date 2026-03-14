import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dtos/login.dto';
import { TokenPair } from './dtos/tokenPair.dto';
import { compare } from 'bcrypt';
import { JwtPayload, JwtTokenType } from './dtos/jwtPayload.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateToken(token: string): Promise<User> {
    const payload = this.jwtService.verify<JwtPayload>(token);
    if (payload.type !== JwtTokenType.ACCESS) {
      throw new BadRequestException('Invalid token type');
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Handles user login by validating credentials and generating JWT tokens.
   * @param dto - The login data transfer object containing email and password.
   * @returns A promise that resolves to a TokenPair containing the access token, refresh token, and expiration time.
   * @throws NotFoundException if the user is not found.
   * @throws BadRequestException if the credentials are invalid or if the token type is incorrect.
   */
  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('User not found');
    const passwordValid = await compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new BadRequestException('Invalid credentials');
    const accessToken = await this.getAccessToken(user.id);
    const refreshToken = await this.getRefreshToken(user.id);
    return {
      accessToken: accessToken.token,
      refreshToken,
      expiresIn: accessToken.expiresAt,
    };
  }

  /**
   * Handles token refresh by validating the provided refresh token and generating new JWT tokens.
   * @param refreshToken - The refresh token to be validated and used for generating new tokens.
   * @returns A promise that resolves to a TokenPair containing the new access token, new refresh token, and expiration time.
   * @throws BadRequestException if the refresh token is invalid or if the token type is incorrect.
   * @throws NotFoundException if the user associated with the token is not found.
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = this.jwtService.verify<JwtPayload>(refreshToken);
    if (payload.type !== JwtTokenType.REFRESH) {
      throw new BadRequestException('Invalid token type');
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user) throw new NotFoundException('User not found');
    const accessToken = await this.getAccessToken(user.id);
    const newRefreshToken = await this.getRefreshToken(user.id);
    return {
      accessToken: accessToken.token,
      refreshToken: newRefreshToken,
      expiresIn: accessToken.expiresAt,
    };
  }

  private async getAccessToken(
    sub: string,
  ): Promise<{ token: string; expiresAt: number }> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    const exp = Math.floor(expiresAt.getTime() / 1000);
    const payload: JwtPayload = {
      sub,
      exp: exp,
      type: JwtTokenType.ACCESS,
    };
    return {
      token: await this.jwtService.signAsync(payload),
      expiresAt: exp,
    };
  }

  private async getRefreshToken(sub: string): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
    const payload: JwtPayload = {
      sub,
      exp: Math.floor(expiresAt.getTime() / 1000),
      type: JwtTokenType.REFRESH,
    };
    return this.jwtService.signAsync(payload);
  }
}

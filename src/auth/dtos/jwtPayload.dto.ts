export enum JwtTokenType {
  ACCESS = 'access_token',
  REFRESH = 'refresh_token',
}

export class JwtPayload {
  sub: string;
  exp: number;
  type: JwtTokenType;
}

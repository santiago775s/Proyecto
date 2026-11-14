export interface PayloadJwt {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}

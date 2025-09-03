import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  async validate(email: string, password: string) { return { id: 1, email }; }
}

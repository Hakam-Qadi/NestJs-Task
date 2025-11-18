import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    validateUser({ username, password }: AuthDto) {
        // find user logic and compare password
        return { message: 'User validated' };
    }
}

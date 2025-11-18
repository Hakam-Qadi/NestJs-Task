import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @UsePipes(new ValidationPipe())
    login(@Body() authDto: AuthDto) {
        return { message: 'Login endpoint' };
    }
}

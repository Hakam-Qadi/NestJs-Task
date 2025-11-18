import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @UseGuards(LocalGuard)
    @UsePipes(new ValidationPipe())
    login(@Req() req: Request) {
        return {
            message: 'Login endpoint',
        };
    }

    @Get('status')
    @UseGuards(JwtAuthGuard)
    getStatus(@Req() req: Request) {
        return { status: 'Account is active' };
    }
}  

import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from 'src/auth/dto/Register.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @UsePipes(new ValidationPipe())
    @ApiBody({ type: RegisterDto })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }


    @Post('login')
    @UseGuards(LocalGuard)
    @UsePipes(new ValidationPipe())
    // to make swagger show the expected body
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'john@example.com' },
                password: { type: 'string', example: 'StrongPass@123' },
            },
        },
    })
    async login(@Req() req: any) {
        return this.authService.login(req.user);
    }
}  

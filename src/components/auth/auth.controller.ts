import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from '../../common/guards/local.guard';
import { RegisterDto } from 'src/components/auth/dto/Register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBody } from '@nestjs/swagger';

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
    @ApiBody({ type: LoginDto })

    async login(@Req() req: any) {
        return this.authService.login(req.user);
    }
}  

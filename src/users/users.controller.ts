import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        return this.usersService.getProfile(req.user.id);
    }

    @Patch('profile')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async updateProfile(@Req() req: any, @Body() updateTaskDto: UpdateUserDto) {
        return this.usersService.update(req.user.id, updateTaskDto);
    }

    @Patch('reset-password')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async resetPassword(@Req() req: any, @Body() updateTaskDto: UpdateUserDto) {
        return this.usersService.resetPassword(req.user.id, updateTaskDto);
    }

    @Delete('profile')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    async deleteAccount(@Req() req: any) {
        return this.usersService.deleteAccount(req.user.id);
    }

}

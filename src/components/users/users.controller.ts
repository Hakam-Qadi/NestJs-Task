import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Req() req: any) {
        return this.usersService.getProfile(req.user.id);
    }

    @Patch('profile')
    async updateProfile(@Req() req: any, @Body() updateTaskDto: UpdateUserDto) {
        return this.usersService.update(req.user.id, updateTaskDto);
    }

    @Patch('reset-password')
    async resetPassword(@Req() req: any, @Body() updateTaskDto: UpdateUserDto) {
        return this.usersService.resetPassword(req.user.id, updateTaskDto);
    }

    @Delete('profile')
    async deleteAccount(@Req() req: any) {
        return this.usersService.deleteAccount(req.user.id);
    }

}

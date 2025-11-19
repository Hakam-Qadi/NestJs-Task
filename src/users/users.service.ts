import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async getProfile(id: string) {
        try {
            const user = await this.userRepository.findOne({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException('User not found');
            }

            return user;

        } catch (err) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (updateUserDto.name) {
            user.name = updateUserDto.name;
        }

        await this.userRepository.save(user);

        const { password, ...result } = user;
        return result;
    }

    async resetPassword(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        user.password = await bcrypt.hash(updateUserDto.password, 10);

        await this.userRepository.save(user);

        return { message: 'Password reset successfully' };
    }


    async deleteAccount(id: string) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        await this.userRepository.delete(id);

        return { message: 'Account deleted successfully' };
    }

}

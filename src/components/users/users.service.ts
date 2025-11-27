import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async getProfile(id: string) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) throw new UnauthorizedException('User not found');

            return user;

        } catch (err) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException('User not found');

        return this.prisma.user.update({
            where: { id },
            data: {
                name: dto.name ?? user.name,
            },
        });
    }

    async resetPassword(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException('User not found');

        const hashed = await bcrypt.hash(dto.password, 10);

        await this.prisma.user.update({
            where: { id },
            data: { password: hashed },
        });

        return { message: 'Password reset successfully' };
    }

    async deleteAccount(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException('User not found');

        await this.prisma.user.delete({ where: { id } });

        return { message: 'Account deleted successfully' };
    }
}

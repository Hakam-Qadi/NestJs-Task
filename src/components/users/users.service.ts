import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { MessageEnum } from '../../common/enums/message.enum';

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
                omit: {
                    password: true,
                    refreshHash: true
                },
                include: {
                    tasks: true
                }
            });

            if (!user) throw new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND);

            return user;

        } catch (err) {
            throw new UnauthorizedException(MessageEnum.error.INVALID_TOKEN);
        }
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND);

        return this.prisma.user.update({
            where: { id },
            data: {
                name: dto.name ?? user.name,
            },
        });
    }

    async resetPassword(id: string, dto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) throw new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND);

        const hashed = await bcrypt.hash(dto.password, 10);

        await this.prisma.user.update({
            where: { id },
            data: { password: hashed },
        });

        return { message: MessageEnum.error.PASSWORD_RESET_SUCCESS };
    }

    async deleteAccount(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id }, omit: { password: true } });

        if (!user) throw new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND);

        await this.prisma.user.delete({ where: { id } });

        return { message: MessageEnum.error.USER_DELETED };
    }
}

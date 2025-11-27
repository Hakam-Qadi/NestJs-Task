import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../../components/auth/dto/Register.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, password: true },
        });

        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return user;
    }

    async login(user: any) {
        const payload = { id: user.id, email: user.email };
        return {
            token: this.jwtService.sign(payload),
            name: user.name,
        };
    }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existing) {
            throw new ConflictException('Email is already registered');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
            },
        });

        const payload = { id: user.id, email: user.email };

        return {
            token: this.jwtService.sign(payload),
            name: user.name,
            email: user.email,
        };
    }
}

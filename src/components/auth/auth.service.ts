import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/components/users/entities/user.entity';
import { RegisterDto } from 'src/components/auth/dto/Register.dto';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return user;
    }

    async login(user: any) {
        const payload = { id: user.id, email: user.email };
        return {
            token: this.jwtService.sign(payload),
            name: user.name
        };
    }

    async register(createUserDto: RegisterDto) {
        const existing = await this.userRepo.findOne({ where: { email: createUserDto.email } });
        if (existing) {
            throw new ConflictException('Email is already registered');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = this.userRepo.create({
            ...createUserDto,
            password: hashedPassword,
        });

        await this.userRepo.save(user);

        const payload = { id: user.id, email: user.email };
        return {
            token: this.jwtService.sign(payload),
            name: user.name,
        };
    }

}

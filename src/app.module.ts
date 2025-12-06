import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TasksModule } from './components/tasks/tasks.module';
import { UsersModule } from './components/users/users.module';
import { AuthModule } from './components/auth/auth.module';
import { AiModule } from './components/ai/ai.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TasksModule,
    UsersModule,
    AuthModule,
    HttpModule,
    AiModule,
    PrismaModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }

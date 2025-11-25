import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../tasks/entities/task.entity';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Task]),
    TasksModule],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule { }

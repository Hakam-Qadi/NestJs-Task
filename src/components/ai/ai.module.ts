import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    ConfigModule,
    TasksModule],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule { }

import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), CommonModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [
    TasksService,
    TypeOrmModule,  // allows repositories to be reused
  ],
})
export class TasksModule { }

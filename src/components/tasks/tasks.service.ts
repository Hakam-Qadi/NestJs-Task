import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) { }

  async create(userId: string, dto: CreateTaskDto) {
    const task = this.taskRepo.create({
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      user: { id: userId },
    });
    return await this.taskRepo.save(task);
  }

  async findAll(userId: string) {
    return this.taskRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.user.id !== userId) throw new ForbiddenException('Access denied');

    const { user, ...result } = task;
    return result;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.user.id !== userId) throw new ForbiddenException('Access denied');

    Object.assign(task, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
    });

    return await this.taskRepo.save(task);
  }

  async remove(userId: string, id: string) {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!task) throw new NotFoundException('Task not found');
    if (task.user.id !== userId) throw new ForbiddenException('Access denied');

    await this.taskRepo.remove(task);
    return { message: 'Task deleted successfully' };
  }
}

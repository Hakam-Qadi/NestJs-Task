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

  async findAll(userId: string, page: number, count: number) {

    if (!page || !count) {
      console.log("Page and Count are missing");
      return;
    }

    const skip = (page - 1) * count;
    const [items, total] = await this.taskRepo.findAndCount({
      where: { user: { id: userId } },
      skip,
      take: count,
      order: { createdAt: 'DESC' },
    });
    return {
      total,
      page,
      count,
      totalPages: Math.ceil(total / count),
      items
    };
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

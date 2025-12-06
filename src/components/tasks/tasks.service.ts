import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'prisma/prisma.service';
import { MessageEnum } from '../../common/enums/message.enum';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        userId: userId,
      },
    });
  }

  async findAll(userId: string, page: number, limit: number) {
    if (!page || !limit) {
      console.log('Page or Limit are missing');
      return;
    }
    const skip = (page - 1) * limit;

    const total = await this.prisma.task.count({
      where: { userId },
    });

    const items = await this.prisma.task.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async findOne(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      }
    });

    if (!task) throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
    if (task.userId !== userId) throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);

    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
    if (task.userId !== userId) throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
      },
    });
  }

  async remove(userId: string, id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
    if (task.userId !== userId) throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);

    await this.prisma.task.delete({ where: { id } });

    return { message: MessageEnum.error.TASK_DELETED };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums/task.enum';
import { MessageEnum } from '../../common/enums/message.enum';

describe('TasksService', () => {
  let service: TasksService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockUserId = 'user-123';
  const mockTaskId = 'task-456';
  const mockDate = new Date('2025-12-01T15:00:00.000Z');

  const mockTask = {
    id: mockTaskId,
    title: 'Complete the project documentation',
    description: 'Finish writing the documentation for the new project by end of the week.',
    dueDate: mockDate,
    status: TaskStatus.PENDING,
    userId: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTaskWithUser = {
    ...mockTask,
    user: {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with all fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Complete the project documentation',
        description: 'Finish writing the documentation for the new project by end of the week.',
        dueDate: '2025-12-01T15:00:00.000Z',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create(mockUserId, createTaskDto);

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          dueDate: new Date(createTaskDto.dueDate),
          userId: mockUserId,
        },
      });
      expect(result).toEqual(mockTask);
    });

    it('should create a task without optional fields (description and dueDate)', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Simple task',
      };

      const taskWithoutOptionals = {
        ...mockTask,
        title: 'Simple task',
        description: null,
        dueDate: null,
      };

      mockPrismaService.task.create.mockResolvedValue(taskWithoutOptionals);

      const result = await service.create(mockUserId, createTaskDto);

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: undefined,
          dueDate: null,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(taskWithoutOptionals);
    });

    it('should create a task with description but without dueDate', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Task with description',
        description: 'This is a description',
      };

      const taskWithDescription = {
        ...mockTask,
        title: 'Task with description',
        description: 'This is a description',
        dueDate: null,
      };

      mockPrismaService.task.create.mockResolvedValue(taskWithDescription);

      const result = await service.create(mockUserId, createTaskDto);

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          dueDate: null,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(taskWithDescription);
    });

    it('should handle database errors during creation', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test task',
      };

      mockPrismaService.task.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockUserId, createTaskDto)).rejects.toThrow('Database error');
      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: undefined,
          dueDate: null,
          userId: mockUserId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks with default pagination', async () => {
      const page = 1;
      const limit = 10;
      const mockTasks = [mockTask, { ...mockTask, id: 'task-789' }];

      mockPrismaService.task.count.mockResolvedValue(25);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(mockUserId, page, limit);

      expect(prismaService.task.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        skip: 0,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        items: mockTasks,
      });
    });

    it('should return paginated tasks with custom pagination (page 2)', async () => {
      const page = 2;
      const limit = 5;
      const mockTasks = [mockTask];

      mockPrismaService.task.count.mockResolvedValue(15);
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findAll(mockUserId, page, limit);

      expect(prismaService.task.count).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(prismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        skip: 5,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
        items: mockTasks,
      });
    });

    it('should return empty results when no tasks exist', async () => {
      const page = 1;
      const limit = 10;

      mockPrismaService.task.count.mockResolvedValue(0);
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUserId, page, limit);

      expect(result).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        items: [],
      });
    });

    it('should return undefined when page is missing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.findAll(mockUserId, 0, 10);

      expect(consoleSpy).toHaveBeenCalledWith('Page or Limit are missing');
      expect(result).toBeUndefined();
      expect(prismaService.task.count).not.toHaveBeenCalled();
      expect(prismaService.task.findMany).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return undefined when limit is missing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.findAll(mockUserId, 1, 0);

      expect(consoleSpy).toHaveBeenCalledWith('Page or Limit are missing');
      expect(result).toBeUndefined();
      expect(prismaService.task.count).not.toHaveBeenCalled();
      expect(prismaService.task.findMany).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return undefined when both page and limit are missing', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.findAll(mockUserId, 0, 0);

      expect(consoleSpy).toHaveBeenCalledWith('Page or Limit are missing');
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should calculate correct skip value for page 3', async () => {
      const page = 3;
      const limit = 10;

      mockPrismaService.task.count.mockResolvedValue(50);
      mockPrismaService.task.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, page, limit);

      expect(prismaService.task.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        skip: 20,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should calculate correct totalPages when total is not divisible by limit', async () => {
      mockPrismaService.task.count.mockResolvedValue(23);
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUserId, 1, 10);

      expect(result?.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a task with user details', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTaskWithUser);

      const result = await service.findOne(mockUserId, mockTaskId);

      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTaskWithUser);
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, 'non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockUserId, 'non-existent-id')).rejects.toThrow(
        MessageEnum.error.TASK_NOT_FOUND
      );
    });

    it('should throw ForbiddenException when task belongs to different user', async () => {
      const taskWithDifferentUser = {
        ...mockTaskWithUser,
        userId: 'different-user-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithDifferentUser);

      await expect(service.findOne(mockUserId, mockTaskId)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne(mockUserId, mockTaskId)).rejects.toThrow(
        MessageEnum.error.ACCESS_DENIED
      );
    });

    it('should handle database errors during findOne', async () => {
      mockPrismaService.task.findUnique.mockRejectedValue(new Error('Database connection error'));

      await expect(service.findOne(mockUserId, mockTaskId)).rejects.toThrow('Database connection error');
    });
  });

  describe('update', () => {
    it('should update a task with all fields', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
        description: 'Updated description',
        status: TaskStatus.IN_PROGRESS,
        dueDate: '2025-12-20T11:00:00.000Z',
      };

      const updatedTask = {
        ...mockTask,
        ...updateTaskDto,
        dueDate: new Date(updateTaskDto.dueDate!),
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: {
          ...updateTaskDto,
          dueDate: new Date(updateTaskDto.dueDate!),
        },
      });
      expect(result).toEqual(updatedTask);
    });

    it('should update a task with partial fields', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title only',
      };

      const updatedTask = {
        ...mockTask,
        title: updateTaskDto.title,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: {
          ...updateTaskDto,
          dueDate: mockTask.dueDate,
        },
      });
      expect(result).toEqual(updatedTask);
    });

    it('should update task status to COMPLETED', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.COMPLETED,
      };

      const updatedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(result.status).toBe(TaskStatus.COMPLETED);
    });

    it('should preserve existing dueDate when not provided in update', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
        description: 'Updated description',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue(mockTask);

      await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: {
          ...updateTaskDto,
          dueDate: mockTask.dueDate,
        },
      });
    });

    it('should update dueDate when provided', async () => {
      const newDueDate = '2025-12-25T10:00:00.000Z';
      const updateTaskDto: UpdateTaskDto = {
        dueDate: newDueDate,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({
        ...mockTask,
        dueDate: new Date(newDueDate),
      });

      await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: mockTaskId },
        data: {
          ...updateTaskDto,
          dueDate: new Date(newDueDate),
        },
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.update(mockUserId, mockTaskId, updateTaskDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(mockUserId, mockTaskId, updateTaskDto)).rejects.toThrow(
        MessageEnum.error.TASK_NOT_FOUND
      );
      expect(prismaService.task.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when task belongs to different user', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      const taskWithDifferentUser = {
        ...mockTask,
        userId: 'different-user-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithDifferentUser);

      await expect(service.update(mockUserId, mockTaskId, updateTaskDto)).rejects.toThrow(
        ForbiddenException
      );
      await expect(service.update(mockUserId, mockTaskId, updateTaskDto)).rejects.toThrow(
        MessageEnum.error.ACCESS_DENIED
      );
      expect(prismaService.task.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockRejectedValue(new Error('Database update failed'));

      await expect(service.update(mockUserId, mockTaskId, updateTaskDto)).rejects.toThrow(
        'Database update failed'
      );
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await service.remove(mockUserId, mockTaskId);

      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
      expect(prismaService.task.delete).toHaveBeenCalledWith({
        where: { id: mockTaskId },
      });
      expect(result).toEqual({
        message: MessageEnum.error.TASK_DELETED,
      });
    });

    it('should throw NotFoundException when task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow(
        MessageEnum.error.TASK_NOT_FOUND
      );
      expect(prismaService.task.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when task belongs to different user', async () => {
      const taskWithDifferentUser = {
        ...mockTask,
        userId: 'different-user-id',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithDifferentUser);

      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow(ForbiddenException);
      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow(
        MessageEnum.error.ACCESS_DENIED
      );
      expect(prismaService.task.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.delete.mockRejectedValue(new Error('Database delete failed'));

      await expect(service.remove(mockUserId, mockTaskId)).rejects.toThrow('Database delete failed');
      expect(prismaService.task.delete).toHaveBeenCalled();
    });
  });

  describe('Edge cases and integration scenarios', () => {
    it('should handle multiple users with isolated data', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';

      mockPrismaService.task.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      mockPrismaService.task.findMany.mockResolvedValueOnce([mockTask]).mockResolvedValueOnce([]);

      const result1 = await service.findAll(user1Id, 1, 10);
      const result2 = await service.findAll(user2Id, 1, 10);

      expect(prismaService.task.count).toHaveBeenCalledWith({ where: { userId: user1Id } });
      expect(prismaService.task.count).toHaveBeenCalledWith({ where: { userId: user2Id } });
      expect(result1?.total).toBe(10);
      expect(result2?.total).toBe(5);
    });

    it('should handle task with null description and dueDate', async () => {
      const taskWithNulls = {
        ...mockTask,
        description: null,
        dueDate: null,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithNulls);

      const result = await service.findOne(mockUserId, mockTaskId);

      expect(result.description).toBeNull();
      expect(result.dueDate).toBeNull();
    });

    it('should correctly handle Date conversion in create', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test task',
        dueDate: '2025-12-31T23:59:59.999Z',
      };

      mockPrismaService.task.create.mockResolvedValue(mockTask);

      await service.create(mockUserId, createTaskDto);

      expect(prismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dueDate: new Date('2025-12-31T23:59:59.999Z'),
        }),
      });
    });

    it('should maintain task status when updating other fields', async () => {
      const taskWithStatus = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      };

      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(taskWithStatus);
      mockPrismaService.task.update.mockResolvedValue({
        ...taskWithStatus,
        title: 'Updated title',
      });

      const result = await service.update(mockUserId, mockTaskId, updateTaskDto);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });
});

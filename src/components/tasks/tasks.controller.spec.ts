// Mock the config module before any imports
jest.mock('../../config/validate-env.config', () => ({
  envSchema: {
    validate: jest.fn().mockReturnValue({
      error: null,
      value: {
        NODE_ENV: 'development',
        APP_VERSION: '1.0.0',
        APP_NAME: 'test',
        DB_PORT: 5432,
        DB_HOST: 'localhost',
        DB_USERNAME: 'test',
        DB_PASSWORD: 'test',
        DB_NAME: 'test',
        JWT_SECRET: 'test-secret',
        JWT_EXPIRY: '1h',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRY: '7d',
        ADVICE_API_URL: 'https://api.adviceslip.com',
        GOOGLE_API_KEY: 'test-key',
        AI_MODEL: 'test-model',
      },
    }),
  },
  envVars: {
    NODE_ENV: 'development',
    APP_VERSION: '1.0.0',
    APP_NAME: 'test',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AdviceService } from '../../common/integrations/advice.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../common/enums/task.enum';
import { MessageEnum } from '../../common/enums/message.enum';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: TasksService;
  let adviceService: AdviceService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAdviceService = {
    getAdvice: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockRequest = {
    user: mockUser,
  };

  const mockTask = {
    id: 'task-123',
    title: 'Complete the project documentation',
    description: 'Finish writing the documentation for the new project by end of the week.',
    dueDate: new Date('2025-12-01T15:00:00.000Z'),
    status: TaskStatus.PENDING,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdvice = {
    slip: {
      id: 123,
      advice: 'Always test your code thoroughly.',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
        {
          provide: AdviceService,
          useValue: mockAdviceService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    tasksService = module.get<TasksService>(TasksService);
    adviceService = module.get<AdviceService>(AdviceService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new task and return it with advice', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Complete the project documentation',
        description: 'Finish writing the documentation for the new project by end of the week.',
        dueDate: '2025-12-01T15:00:00.000Z',
      };

      mockTasksService.create.mockResolvedValue(mockTask);
      mockAdviceService.getAdvice.mockResolvedValue(mockAdvice);

      const result = await controller.create(mockRequest, createTaskDto);

      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
      expect(adviceService.getAdvice).toHaveBeenCalled();
      expect(result).toEqual({
        task: mockTask,
        advice: mockAdvice,
      });
    });

    it('should create a task without optional fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Simple task',
      };

      const taskWithoutOptionals = {
        ...mockTask,
        title: 'Simple task',
        description: null,
        dueDate: null,
      };

      mockTasksService.create.mockResolvedValue(taskWithoutOptionals);
      mockAdviceService.getAdvice.mockResolvedValue(mockAdvice);

      const result = await controller.create(mockRequest, createTaskDto);

      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
      expect(adviceService.getAdvice).toHaveBeenCalled();
      expect(result).toEqual({
        task: taskWithoutOptionals,
        advice: mockAdvice,
      });
    });

    it('should handle service errors during task creation', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test task',
      };

      const error = new Error('Database error');
      mockTasksService.create.mockRejectedValue(error);

      await expect(controller.create(mockRequest, createTaskDto)).rejects.toThrow('Database error');
      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
      expect(adviceService.getAdvice).not.toHaveBeenCalled();
    });

    it('should handle advice service errors', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test task',
      };

      mockTasksService.create.mockResolvedValue(mockTask);
      mockAdviceService.getAdvice.mockRejectedValue(new Error('Advice service error'));

      await expect(controller.create(mockRequest, createTaskDto)).rejects.toThrow('Advice service error');
      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, createTaskDto);
      expect(adviceService.getAdvice).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks with default pagination', () => {
      const mockPaginatedResponse = {
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        items: [mockTask],
      };

      mockTasksService.findAll.mockReturnValue(mockPaginatedResponse);

      const result = controller.findAll(mockRequest, 1, 10);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 1, 10);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return paginated tasks with custom pagination', () => {
      const mockPaginatedResponse = {
        total: 50,
        page: 2,
        limit: 20,
        totalPages: 3,
        items: [mockTask, { ...mockTask, id: 'task-456' }],
      };

      mockTasksService.findAll.mockReturnValue(mockPaginatedResponse);

      const result = controller.findAll(mockRequest, 2, 20);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 2, 20);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle page number 1', () => {
      const mockPaginatedResponse = {
        total: 5,
        page: 1,
        limit: 10,
        totalPages: 1,
        items: [mockTask],
      };

      mockTasksService.findAll.mockReturnValue(mockPaginatedResponse);

      const result = controller.findAll(mockRequest, 1, 10);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 1, 10);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle empty results', () => {
      const mockPaginatedResponse = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        items: [],
      };

      mockTasksService.findAll.mockReturnValue(mockPaginatedResponse);

      const result = controller.findAll(mockRequest, 1, 10);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 1, 10);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle large page numbers', () => {
      const mockPaginatedResponse = {
        total: 100,
        page: 10,
        limit: 10,
        totalPages: 10,
        items: [],
      };

      mockTasksService.findAll.mockReturnValue(mockPaginatedResponse);

      const result = controller.findAll(mockRequest, 10, 10);

      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 10, 10);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    it('should return a single task with advice', async () => {
      const taskId = 'task-123';
      const taskWithUser = {
        ...mockTask,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      mockTasksService.findOne.mockResolvedValue(taskWithUser);
      mockAdviceService.getAdvice.mockResolvedValue(mockAdvice);

      const result = await controller.findOne(mockRequest, taskId);

      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(adviceService.getAdvice).toHaveBeenCalled();
      expect(result).toEqual({
        task: taskWithUser,
        advice: mockAdvice,
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      const taskId = 'non-existent-task';
      const error = new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
      
      mockTasksService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockRequest, taskId)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(mockRequest, taskId)).rejects.toThrow(MessageEnum.error.TASK_NOT_FOUND);
      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(adviceService.getAdvice).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when access denied', async () => {
      const taskId = 'task-123';
      const error = new ForbiddenException(MessageEnum.error.ACCESS_DENIED);
      
      mockTasksService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockRequest, taskId)).rejects.toThrow(ForbiddenException);
      await expect(controller.findOne(mockRequest, taskId)).rejects.toThrow(MessageEnum.error.ACCESS_DENIED);
      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(adviceService.getAdvice).not.toHaveBeenCalled();
    });

    it('should handle advice service errors during findOne', async () => {
      const taskId = 'task-123';

      mockTasksService.findOne.mockResolvedValue(mockTask);
      mockAdviceService.getAdvice.mockRejectedValue(new Error('Advice service unavailable'));

      await expect(controller.findOne(mockRequest, taskId)).rejects.toThrow('Advice service unavailable');
      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(adviceService.getAdvice).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task with all fields', () => {
      const taskId = 'task-123';
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

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should update a task with partial fields', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title only',
      };

      const updatedTask = {
        ...mockTask,
        title: updateTaskDto.title,
      };

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should update task status to COMPLETED', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.COMPLETED,
      };

      const updatedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
      };

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should update task status to PENDING', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        status: TaskStatus.PENDING,
      };

      const updatedTask = {
        ...mockTask,
        status: TaskStatus.PENDING,
      };

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException when task not found during update', () => {
      const taskId = 'non-existent-task';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      mockTasksService.update.mockImplementation(() => {
        throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
      });

      expect(() => controller.update(mockRequest, taskId, updateTaskDto)).toThrow(NotFoundException);
      expect(() => controller.update(mockRequest, taskId, updateTaskDto)).toThrow(MessageEnum.error.TASK_NOT_FOUND);
      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
    });

    it('should throw ForbiddenException when access denied during update', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated title',
      };

      mockTasksService.update.mockImplementation(() => {
        throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);
      });

      expect(() => controller.update(mockRequest, taskId, updateTaskDto)).toThrow(ForbiddenException);
      expect(() => controller.update(mockRequest, taskId, updateTaskDto)).toThrow(MessageEnum.error.ACCESS_DENIED);
      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
    });

    it('should update only the description', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        description: 'New description',
      };

      const updatedTask = {
        ...mockTask,
        description: updateTaskDto.description,
      };

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });

    it('should update only the dueDate', () => {
      const taskId = 'task-123';
      const updateTaskDto: UpdateTaskDto = {
        dueDate: '2025-12-25T10:00:00.000Z',
      };

      const updatedTask = {
        ...mockTask,
        dueDate: new Date(updateTaskDto.dueDate!),
      };

      mockTasksService.update.mockReturnValue(updatedTask);

      const result = controller.update(mockRequest, taskId, updateTaskDto);

      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateTaskDto);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', () => {
      const taskId = 'task-123';
      const deleteResponse = {
        message: 'Task deleted successfully.',
      };

      mockTasksService.remove.mockReturnValue(deleteResponse);

      const result = controller.remove(mockRequest, taskId);

      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(result).toEqual(deleteResponse);
    });

    it('should throw NotFoundException when task not found during deletion', () => {
      const taskId = 'non-existent-task';

      mockTasksService.remove.mockImplementation(() => {
        throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND);
      });

      expect(() => controller.remove(mockRequest, taskId)).toThrow(NotFoundException);
      expect(() => controller.remove(mockRequest, taskId)).toThrow(MessageEnum.error.TASK_NOT_FOUND);
      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, taskId);
    });

    it('should throw ForbiddenException when access denied during deletion', () => {
      const taskId = 'task-123';

      mockTasksService.remove.mockImplementation(() => {
        throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);
      });

      expect(() => controller.remove(mockRequest, taskId)).toThrow(ForbiddenException);
      expect(() => controller.remove(mockRequest, taskId)).toThrow(MessageEnum.error.ACCESS_DENIED);
      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, taskId);
    });

    it('should handle database errors during deletion', () => {
      const taskId = 'task-123';

      mockTasksService.remove.mockImplementation(() => {
        throw new Error('Database connection error');
      });

      expect(() => controller.remove(mockRequest, taskId)).toThrow('Database connection error');
      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, taskId);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple users accessing their own tasks', () => {
      const user1 = { ...mockRequest, user: { id: 'user-1', email: 'user1@test.com', name: 'User 1' } };
      const user2 = { ...mockRequest, user: { id: 'user-2', email: 'user2@test.com', name: 'User 2' } };

      const response1 = { total: 5, page: 1, limit: 10, totalPages: 1, items: [mockTask] };
      const response2 = { total: 3, page: 1, limit: 10, totalPages: 1, items: [] };

      mockTasksService.findAll.mockReturnValueOnce(response1).mockReturnValueOnce(response2);

      const result1 = controller.findAll(user1, 1, 10);
      const result2 = controller.findAll(user2, 1, 10);

      expect(tasksService.findAll).toHaveBeenCalledWith('user-1', 1, 10);
      expect(tasksService.findAll).toHaveBeenCalledWith('user-2', 1, 10);
      expect(result1).toEqual(response1);
      expect(result2).toEqual(response2);
    });

    it('should properly pass user ID to all service methods', async () => {
      const taskId = 'task-123';
      const createDto: CreateTaskDto = { title: 'New task' };
      const updateDto: UpdateTaskDto = { title: 'Updated' };

      mockTasksService.create.mockResolvedValue(mockTask);
      mockAdviceService.getAdvice.mockResolvedValue(mockAdvice);
      mockTasksService.findAll.mockReturnValue({ total: 0, page: 1, limit: 10, totalPages: 0, items: [] });
      mockTasksService.findOne.mockResolvedValue(mockTask);
      mockTasksService.update.mockReturnValue(mockTask);
      mockTasksService.remove.mockReturnValue({ message: 'Task deleted successfully.' });

      await controller.create(mockRequest, createDto);
      controller.findAll(mockRequest, 1, 10);
      await controller.findOne(mockRequest, taskId);
      controller.update(mockRequest, taskId, updateDto);
      controller.remove(mockRequest, taskId);

      expect(tasksService.create).toHaveBeenCalledWith(mockUser.id, createDto);
      expect(tasksService.findAll).toHaveBeenCalledWith(mockUser.id, 1, 10);
      expect(tasksService.findOne).toHaveBeenCalledWith(mockUser.id, taskId);
      expect(tasksService.update).toHaveBeenCalledWith(mockUser.id, taskId, updateDto);
      expect(tasksService.remove).toHaveBeenCalledWith(mockUser.id, taskId);
    });
  });
});

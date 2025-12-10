import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { MessageEnum } from '../../common/enums/message.enum';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockDate = new Date('2025-12-01T10:00:00.000Z');

  const mockUser = {
    id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword123',
    refreshHash: 'refreshHash123',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  const mockUserWithTasks = {
    id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: mockDate,
    updatedAt: mockDate,
    tasks: [
      {
        id: 'task-1',
        title: 'Task 1',
        description: 'Description 1',
        status: 'PENDING',
        dueDate: mockDate,
        userId: mockUserId,
        createdAt: mockDate,
        updatedAt: mockDate,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile with tasks', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithTasks);

      const result = await service.getProfile(mockUserId);

      expect(result).toEqual(mockUserWithTasks);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        omit: {
          password: true,
          refreshHash: true,
        },
        include: {
          tasks: true,
        },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        new UnauthorizedException(MessageEnum.error.INVALID_TOKEN),
      );
    });

    it('should throw UnauthorizedException when database error occurs', async () => {
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getProfile(mockUserId)).rejects.toThrow(
        new UnauthorizedException(MessageEnum.error.INVALID_TOKEN),
      );
    });

    it('should return user profile without tasks', async () => {
      const userWithoutTasks = { ...mockUserWithTasks, tasks: [] };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutTasks);

      const result = await service.getProfile(mockUserId);

      expect(result).toEqual(userWithoutTasks);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update user name', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };
      const updatedUser = { ...mockUser, name: 'Jane Doe' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUserId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          name: 'Jane Doe',
        },
      });
    });

    it('should preserve existing name when dto.name is undefined', async () => {
      const updateDto: UpdateUserDto = {};

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.update(mockUserId, updateDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          name: mockUser.name,
        },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(mockUserId, updateDto)).rejects.toThrow(
        new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND),
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update(mockUserId, updateDto)).rejects.toThrow('Database error');
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      const hashedPassword = 'newHashedPassword';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.resetPassword(mockUserId, updateDto);

      expect(result).toEqual({ message: MessageEnum.error.PASSWORD_RESET_SUCCESS });
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { password: hashedPassword },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(mockUserId, updateDto)).rejects.toThrow(
        new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND),
      );

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle bcrypt hashing errors', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing error'));

      await expect(service.resetPassword(mockUserId, updateDto)).rejects.toThrow('Hashing error');
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during password update', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      const hashedPassword = 'newHashedPassword';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockPrismaService.user.update.mockRejectedValue(new Error('Database error'));

      await expect(service.resetPassword(mockUserId, updateDto)).rejects.toThrow('Database error');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const userWithoutPassword = {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteAccount(mockUserId);

      expect(result).toEqual({ message: MessageEnum.error.USER_DELETED });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        omit: { password: true },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount(mockUserId)).rejects.toThrow(
        new UnauthorizedException(MessageEnum.error.USER_NOT_FOUND),
      );

      expect(mockPrismaService.user.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const userWithoutPassword = {
        id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithoutPassword);
      mockPrismaService.user.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.deleteAccount(mockUserId)).rejects.toThrow('Database error');
    });
  });

  describe('Edge cases and integration scenarios', () => {
    it('should handle user with multiple tasks', async () => {
      const userWithMultipleTasks = {
        ...mockUserWithTasks,
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'PENDING',
            dueDate: mockDate,
            userId: mockUserId,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
          {
            id: 'task-2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'COMPLETED',
            dueDate: mockDate,
            userId: mockUserId,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(userWithMultipleTasks);

      const result = await service.getProfile(mockUserId);

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].status).toBe('PENDING');
      expect(result.tasks[1].status).toBe('COMPLETED');
    });

    it('should update name to empty string if provided', async () => {
      const updateDto: UpdateUserDto = { name: '' };
      const updatedUser = { ...mockUser, name: '' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      await service.update(mockUserId, updateDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          name: '',
        },
      });
    });

    it('should handle special characters in user name', async () => {
      const updateDto: UpdateUserDto = { name: "O'Brien-Smith Jr." };
      const updatedUser = { ...mockUser, name: "O'Brien-Smith Jr." };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUserId, updateDto);

      expect(result.name).toBe("O'Brien-Smith Jr.");
    });
  });
});

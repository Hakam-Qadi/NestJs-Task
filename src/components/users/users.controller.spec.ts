import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { MessageEnum } from '../../common/enums/message.enum';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getProfile: jest.fn(),
    update: jest.fn(),
    resetPassword: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockDate = new Date('2025-12-01T10:00:00.000Z');

  const mockUser = {
    id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: mockDate,
    updatedAt: mockDate,
    tasks: [],
  };

  const mockRequest = {
    user: {
      id: mockUserId,
      email: 'john@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.getProfile).toHaveBeenCalledWith(mockUserId);
      expect(mockUsersService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should return user profile with tasks', async () => {
      const userWithTasks = {
        ...mockUser,
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            description: 'Test task',
            status: 'PENDING',
            dueDate: mockDate,
            userId: mockUserId,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
      };
      mockUsersService.getProfile.mockResolvedValue(userWithTasks);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(userWithTasks);
      expect(result.tasks).toHaveLength(1);
    });

    it('should pass correct user id from request', async () => {
      const customRequest = {
        user: {
          id: 'different-user-id',
          email: 'different@example.com',
        },
      };
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      await controller.getProfile(customRequest);

      expect(mockUsersService.getProfile).toHaveBeenCalledWith('different-user-id');
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockUsersService.getProfile.mockRejectedValue(error);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow('Service error');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };
      const updatedUser = { ...mockUser, name: 'Jane Doe' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(mockUsersService.update).toHaveBeenCalledTimes(1);
    });

    it('should update with empty dto', async () => {
      const updateDto: UpdateUserDto = {};
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
    });

    it('should update name only', async () => {
      const updateDto: UpdateUserDto = { name: 'New Name' };
      const updatedUser = { ...mockUser, name: 'New Name' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result.name).toBe('New Name');
      expect(mockUsersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
    });

    it('should handle service errors during update', async () => {
      const updateDto: UpdateUserDto = { name: 'Jane Doe' };
      const error = new Error('Update failed');
      mockUsersService.update.mockRejectedValue(error);

      await expect(controller.updateProfile(mockRequest, updateDto)).rejects.toThrow('Update failed');
    });

    it('should pass correct user id from request', async () => {
      const customRequest = {
        user: {
          id: 'another-user-id',
          email: 'another@example.com',
        },
      };
      const updateDto: UpdateUserDto = { name: 'Updated Name' };
      mockUsersService.update.mockResolvedValue(mockUser);

      await controller.updateProfile(customRequest, updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith('another-user-id', updateDto);
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      const successResponse = { message: MessageEnum.error.PASSWORD_RESET_SUCCESS };
      mockUsersService.resetPassword.mockResolvedValue(successResponse);

      const result = await controller.resetPassword(mockRequest, updateDto);

      expect(result).toEqual(successResponse);
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(mockUserId, updateDto);
      expect(mockUsersService.resetPassword).toHaveBeenCalledTimes(1);
    });

    it('should handle strong passwords', async () => {
      const updateDto: UpdateUserDto = { password: 'VeryStrong@Pass123!' };
      const successResponse = { message: MessageEnum.error.PASSWORD_RESET_SUCCESS };
      mockUsersService.resetPassword.mockResolvedValue(successResponse);

      const result = await controller.resetPassword(mockRequest, updateDto);

      expect(result).toEqual(successResponse);
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(mockUserId, updateDto);
    });

    it('should handle service errors during password reset', async () => {
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      const error = new Error('Password reset failed');
      mockUsersService.resetPassword.mockRejectedValue(error);

      await expect(controller.resetPassword(mockRequest, updateDto)).rejects.toThrow('Password reset failed');
    });

    it('should pass correct user id from request', async () => {
      const customRequest = {
        user: {
          id: 'user-to-reset',
          email: 'reset@example.com',
        },
      };
      const updateDto: UpdateUserDto = { password: 'NewPassword123!' };
      const successResponse = { message: MessageEnum.error.PASSWORD_RESET_SUCCESS };
      mockUsersService.resetPassword.mockResolvedValue(successResponse);

      await controller.resetPassword(customRequest, updateDto);

      expect(mockUsersService.resetPassword).toHaveBeenCalledWith('user-to-reset', updateDto);
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      const successResponse = { message: MessageEnum.error.USER_DELETED };
      mockUsersService.deleteAccount.mockResolvedValue(successResponse);

      const result = await controller.deleteAccount(mockRequest);

      expect(result).toEqual(successResponse);
      expect(mockUsersService.deleteAccount).toHaveBeenCalledWith(mockUserId);
      expect(mockUsersService.deleteAccount).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors during deletion', async () => {
      const error = new Error('Deletion failed');
      mockUsersService.deleteAccount.mockRejectedValue(error);

      await expect(controller.deleteAccount(mockRequest)).rejects.toThrow('Deletion failed');
    });

    it('should pass correct user id from request', async () => {
      const customRequest = {
        user: {
          id: 'user-to-delete',
          email: 'delete@example.com',
        },
      };
      const successResponse = { message: MessageEnum.error.USER_DELETED };
      mockUsersService.deleteAccount.mockResolvedValue(successResponse);

      await controller.deleteAccount(customRequest);

      expect(mockUsersService.deleteAccount).toHaveBeenCalledWith('user-to-delete');
    });
  });

  describe('Edge cases and integration scenarios', () => {
    it('should handle multiple sequential operations', async () => {
      mockUsersService.getProfile.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue({ ...mockUser, name: 'Updated' });
      mockUsersService.deleteAccount.mockResolvedValue({ message: MessageEnum.error.USER_DELETED });

      await controller.getProfile(mockRequest);
      await controller.updateProfile(mockRequest, { name: 'Updated' });
      await controller.deleteAccount(mockRequest);

      expect(mockUsersService.getProfile).toHaveBeenCalledTimes(1);
      expect(mockUsersService.update).toHaveBeenCalledTimes(1);
      expect(mockUsersService.deleteAccount).toHaveBeenCalledTimes(1);
    });

    it('should handle request without user object', async () => {
      const invalidRequest: any = {};
      mockUsersService.getProfile.mockResolvedValue(mockUser);

      // This should cause an error when trying to access req.user.id
      await expect(controller.getProfile(invalidRequest)).rejects.toThrow();
    });

    it('should handle special characters in update data', async () => {
      const updateDto: UpdateUserDto = { name: "O'Brien-Smith Jr." };
      const updatedUser = { ...mockUser, name: "O'Brien-Smith Jr." };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockRequest, updateDto);

      expect(result.name).toBe("O'Brien-Smith Jr.");
    });

    it('should handle both name and password in dto (only name should be used for profile update)', async () => {
      const updateDto: UpdateUserDto = {
        name: 'New Name',
        password: 'NewPassword123!',
      };
      const updatedUser = { ...mockUser, name: 'New Name' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      await controller.updateProfile(mockRequest, updateDto);

      expect(mockUsersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
    });
  });
});

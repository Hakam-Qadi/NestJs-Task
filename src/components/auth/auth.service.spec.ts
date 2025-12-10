import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, ForbiddenException } from '@nestjs/common';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock the config module before imports
jest.mock('../../config/env.config', () => ({
  serviceConfig: {
    service: {
      jwtSecret: 'test-jwt-secret',
      jwtExpiry: '15m',
      jwtRefreshSecret: 'test-refresh-secret',
      jwtRefreshExpiry: '7d',
    },
  },
}));

// Import bcrypt after mocking
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('[Login Simulator] - validateUser', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: '$2b$10$hashedPassword',
    };

    it('should successfully validate user with correct credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'correctPassword');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, name: true, email: true, password: true },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', mockUser.password);
    });

    it('should return null when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        select: { id: true, name: true, email: true, password: true },
      });
    });

    it('should return null when password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongPassword');

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
    });

    it('should handle empty email gracefully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('', 'password');

      expect(result).toBeNull();
    });

    it('should handle special characters in password', async () => {
      const specialPassword = '!@#$%^&*()_+{}:"<>?[];\',./`~';
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', specialPassword);

      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(specialPassword, mockUser.password);
    });
  });

  describe('[Login Simulator] - login', () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.sign.mockReturnValueOnce('mock-access-token').mockReturnValueOnce('mock-refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      mockPrismaService.user.update.mockResolvedValue(mockUser);
    });

    it('should successfully login and return tokens with user name', async () => {
      const result = await service.login(mockUser);

      expect(result).toEqual({
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        name: mockUser.name,
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should generate different tokens for each login attempt', async () => {
      mockJwtService.sign
        .mockReturnValueOnce('access-token-1')
        .mockReturnValueOnce('refresh-token-1')
        .mockReturnValueOnce('access-token-2')
        .mockReturnValueOnce('refresh-token-2');

      const result1 = await service.login(mockUser);
      const result2 = await service.login(mockUser);

      expect(result1.token).not.toEqual(result2.token);
      expect(result1.refreshToken).not.toEqual(result2.refreshToken);
    });

    it('should store hashed refresh token in database', async () => {
      await service.login(mockUser);

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshHash: 'hashed-token' },
      });
    });

    it('should handle user with long name', async () => {
      const userWithLongName = {
        ...mockUser,
        name: 'A'.repeat(255),
      };

      const result = await service.login(userWithLongName);

      expect(result.name).toEqual('A'.repeat(255));
    });

    it('should include user ID in JWT payload', async () => {
      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { id: mockUser.id, email: mockUser.email },
        expect.any(Object),
      );
    });
  });

  describe('[Login Simulator] - generateTokens', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
      mockPrismaService.user.update.mockResolvedValue(mockUser);
    });

    it('should generate both access and refresh tokens', async () => {
      const result = await service.generateTokens(mockUser);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should call JWT service with correct payload', async () => {
      await service.generateTokens(mockUser);

      const expectedPayload = { id: mockUser.id, email: mockUser.email };
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload, expect.any(Object));
    });

    it('should save hashed refresh token', async () => {
      await service.generateTokens(mockUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('refresh-token', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshHash: 'hashed-token' },
      });
    });
  });

  describe('[Login Simulator] - refreshTokens', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      refreshHash: 'stored-hashed-token',
    };

    const mockPayload = {
      id: 'user-123',
      email: 'test@example.com',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-token');
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');
      mockPrismaService.user.update.mockResolvedValue(mockUser);
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-refresh-token', expect.any(Object));
    });

    it('should throw ForbiddenException when refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-refresh-token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user has no stored refresh token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshHash: null,
      });

      await expect(service.refreshTokens('valid-refresh-token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when refresh token does not match stored hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('mismatched-token')).rejects.toThrow(ForbiddenException);
    });

    it('should rotate refresh token after successful refresh', async () => {
      await service.refreshTokens('valid-refresh-token');

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshHash: 'new-hashed-token' },
      });
    });

    it('should handle expired refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('[Login Simulator] - register', () => {
    const registerDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
    };

    const mockCreatedUser = {
      id: 'new-user-123',
      name: registerDto.name,
      email: registerDto.email,
      password: '$2b$10$hashedPassword',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockImplementation((password) => Promise.resolve(`hashed-${password}`));
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockPrismaService.user.update.mockResolvedValue(mockCreatedUser);
    });

    it('should successfully register a new user and return tokens', async () => {
      const result = await service.register(registerDto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result).toHaveProperty('name', registerDto.name);
      expect(result).toHaveProperty('email', registerDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: `hashed-${registerDto.password}`,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockCreatedUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should check for existing email before creating user', async () => {
      await service.register(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });
  });
});

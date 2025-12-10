import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForbiddenException } from '@nestjs/common';
import { Response } from 'express';

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

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refreshTokens: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('[Login Simulator] - login endpoint', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    };

    const mockLoginResult = {
      token: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      name: 'Test User',
    };

    const mockRequest = {
      user: mockUser,
    };

    beforeEach(() => {
      mockAuthService.login.mockResolvedValue(mockLoginResult);
    });

    it('should successfully login and return access token with user name', async () => {
      const result = await controller.login(mockRequest as any, mockResponse);

      expect(result).toEqual({
        token: mockLoginResult.token,
        name: mockLoginResult.name,
      });
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should set refresh token as httpOnly cookie', async () => {
      await controller.login(mockRequest as any, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockLoginResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });

    it('should not include refresh token in response body', async () => {
      const result = await controller.login(mockRequest as any, mockResponse);

      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('name');
    });

    it('should handle login with validated user from LocalGuard', async () => {
      const validatedUser = {
        id: 'validated-user-456',
        email: 'validated@example.com',
        name: 'Validated User',
      };

      const validatedRequest = {
        user: validatedUser,
      };

      mockAuthService.login.mockResolvedValue({
        token: 'validated-access-token',
        refreshToken: 'validated-refresh-token',
        name: validatedUser.name,
      });

      const result = await controller.login(validatedRequest as any, mockResponse);

      expect(result.name).toBe(validatedUser.name);
      expect(authService.login).toHaveBeenCalledWith(validatedUser);
    });

    it('should call authService.login with correct user object', async () => {
      await controller.login(mockRequest as any, mockResponse);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should handle user with special characters in name', async () => {
      const specialUser = {
        id: 'user-789',
        email: 'special@example.com',
        name: "O'Brien-Smith (Test) <Special>",
      };

      const specialRequest = {
        user: specialUser,
      };

      mockAuthService.login.mockResolvedValue({
        token: 'special-token',
        refreshToken: 'special-refresh',
        name: specialUser.name,
      });

      const result = await controller.login(specialRequest as any, mockResponse);

      expect(result.name).toBe(specialUser.name);
    });

    it('should set secure cookie options for refresh token', async () => {
      await controller.login(mockRequest as any, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });
  });

  describe('[Login Simulator] - register endpoint', () => {
    const registerDto = {
      name: 'New User',
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
    };

    const mockRegisterResult = {
      token: 'register-access-token',
      refreshToken: 'register-refresh-token',
      name: registerDto.name,
      email: registerDto.email,
    };

    beforeEach(() => {
      mockAuthService.register.mockResolvedValue(mockRegisterResult);
    });

    it('should successfully register and return token with user details', async () => {
      const result = await controller.register(registerDto, mockResponse);

      expect(result).toEqual({
        token: mockRegisterResult.token,
        name: mockRegisterResult.name,
        email: mockRegisterResult.email,
      });
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should set refresh token as httpOnly cookie on registration', async () => {
      await controller.register(registerDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockRegisterResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });

    it('should not include refresh token in registration response body', async () => {
      const result = await controller.register(registerDto, mockResponse);

      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('should include email in registration response', async () => {
      const result = await controller.register(registerDto, mockResponse);

      expect(result.email).toBe(registerDto.email);
    });
  });

  describe('[Login Simulator] - refresh endpoint', () => {
    const mockRefreshResult = {
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    beforeEach(() => {
      mockAuthService.refreshTokens.mockResolvedValue(mockRefreshResult);
    });

    it('should successfully refresh tokens from cookie', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'valid-refresh-token',
        },
        body: {},
      } as any;

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(result).toEqual({ token: mockRefreshResult.token });
      expect(authService.refreshTokens).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should successfully refresh tokens from request body', async () => {
      const mockRequest = {
        cookies: {},
        body: {
          refreshToken: 'body-refresh-token',
        },
      } as any;

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(result).toEqual({ token: mockRefreshResult.token });
      expect(authService.refreshTokens).toHaveBeenCalledWith('body-refresh-token');
    });

    it('should prioritize cookie refresh token over body', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'cookie-refresh-token',
        },
        body: {
          refreshToken: 'body-refresh-token',
        },
      } as any;

      await controller.refresh(mockRequest, mockResponse);

      expect(authService.refreshTokens).toHaveBeenCalledWith('cookie-refresh-token');
    });

    it('should throw ForbiddenException when no refresh token provided', async () => {
      const mockRequest = {
        cookies: {},
        body: {},
      } as any;

      await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow(ForbiddenException);
      expect(authService.refreshTokens).not.toHaveBeenCalled();
    });

    it('should set new refresh token as cookie after refresh', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'old-refresh-token',
        },
        body: {},
      } as any;

      await controller.refresh(mockRequest, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockRefreshResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });

    it('should not include refresh token in response body', async () => {
      const mockRequest = {
        cookies: {
          refreshToken: 'valid-refresh-token',
        },
        body: {},
      } as any;

      const result = await controller.refresh(mockRequest, mockResponse);

      expect(result).not.toHaveProperty('refreshToken');
      expect(result).toHaveProperty('token');
    });

    it('should handle empty cookies object', async () => {
      const mockRequest = {
        body: {},
      } as any;

      await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('[Login Simulator] - Integration scenarios', () => {
    it('should maintain consistent cookie settings across all endpoints', async () => {
      const loginRequest = {
        user: { id: '1', email: 'test@test.com', name: 'Test' },
      };

      const registerDto = {
        name: 'New',
        email: 'new@test.com',
        password: 'pass123',
      };

      const refreshRequest = {
        cookies: { refreshToken: 'token' },
        body: {},
      };

      mockAuthService.login.mockResolvedValue({
        token: 'at',
        refreshToken: 'rt',
        name: 'Test',
      });
      mockAuthService.register.mockResolvedValue({
        token: 'at',
        refreshToken: 'rt',
        name: 'New',
        email: 'new@test.com',
      });
      mockAuthService.refreshTokens.mockResolvedValue({
        token: 'at',
        refreshToken: 'rt',
      });

      await controller.login(loginRequest as any, mockResponse);
      const loginCookieCall = (mockResponse.cookie as jest.Mock).mock.calls[0];

      await controller.register(registerDto, mockResponse);
      const registerCookieCall = (mockResponse.cookie as jest.Mock).mock.calls[1];

      await controller.refresh(refreshRequest as any, mockResponse);
      const refreshCookieCall = (mockResponse.cookie as jest.Mock).mock.calls[2];

      // All should use same cookie configuration
      expect(loginCookieCall[0]).toBe('refreshToken');
      expect(registerCookieCall[0]).toBe('refreshToken');
      expect(refreshCookieCall[0]).toBe('refreshToken');
    });
  });
});

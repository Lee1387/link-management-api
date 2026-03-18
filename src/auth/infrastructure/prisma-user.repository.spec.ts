import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { type CreateAuthUserInput } from '../domain/auth-user.repository';
import { PrismaUserRepository } from './prisma-user.repository';

describe('PrismaUserRepository', () => {
  let prismaUserRepository: PrismaUserRepository;
  let prismaService: {
    user: {
      create: jest.Mock<
        Promise<{
          id: string;
          email: string;
          passwordHash: string;
          createdAt: Date;
          updatedAt: Date;
        }>,
        [{ data: CreateAuthUserInput }]
      >;
      findUnique: jest.Mock<
        Promise<{
          id: string;
          email: string;
          passwordHash: string;
          createdAt: Date;
          updatedAt: Date;
        } | null>,
        [{ where: { email: string } }]
      >;
    };
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        create: jest.fn<
          Promise<{
            id: string;
            email: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
          }>,
          [{ data: CreateAuthUserInput }]
        >(),
        findUnique: jest.fn<
          Promise<{
            id: string;
            email: string;
            passwordHash: string;
            createdAt: Date;
            updatedAt: Date;
          } | null>,
          [{ where: { email: string } }]
        >(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    prismaUserRepository =
      module.get<PrismaUserRepository>(PrismaUserRepository);
  });

  it('should persist and map a user', async () => {
    const input: CreateAuthUserInput = {
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
    };
    const prismaUser = {
      id: 'user_123',
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    prismaService.user.create.mockResolvedValue(prismaUser);

    await expect(prismaUserRepository.create(input)).resolves.toEqual(
      prismaUser,
    );
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('should resolve a user by email', async () => {
    const prismaUser = {
      id: 'user_123',
      email: 'alex@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    };
    prismaService.user.findUnique.mockResolvedValue(prismaUser);

    await expect(
      prismaUserRepository.findByEmail(prismaUser.email),
    ).resolves.toEqual(prismaUser);
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: prismaUser.email,
      },
    });
  });

  it('should return null when a user email is not found', async () => {
    prismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      prismaUserRepository.findByEmail('missing@example.com'),
    ).resolves.toBeNull();
    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'missing@example.com',
      },
    });
  });
});

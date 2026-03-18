import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LivenessResponseDto,
  ReadinessErrorResponseDto,
  ReadinessResponseDto,
} from './health.response';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  getLiveness(): LivenessResponseDto {
    return {
      status: 'ok',
      checks: {
        application: 'up',
      },
    };
  }

  async getReadiness(): Promise<ReadinessResponseDto> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        checks: {
          database: 'up',
        },
      };
    } catch {
      const response: ReadinessErrorResponseDto = {
        status: 'error',
        checks: {
          database: 'down',
        },
      };

      throw new ServiceUnavailableException(response);
    }
  }
}

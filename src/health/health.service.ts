import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LivenessResponse {
  status: 'ok';
  checks: {
    application: 'up';
  };
}

export interface ReadinessResponse {
  status: 'ok';
  checks: {
    database: 'up';
  };
}

export interface ReadinessErrorResponse {
  status: 'error';
  checks: {
    database: 'down';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      checks: {
        application: 'up',
      },
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        checks: {
          database: 'up',
        },
      };
    } catch {
      const response: ReadinessErrorResponse = {
        status: 'error',
        checks: {
          database: 'down',
        },
      };

      throw new ServiceUnavailableException(response);
    }
  }
}

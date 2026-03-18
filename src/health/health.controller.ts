import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService } from './health.service';
import type {
  LivenessResponseDto,
  ReadinessResponseDto,
} from './health.response';
import {
  LivenessResponseDto as LivenessResponseModel,
  ReadinessErrorResponseDto,
  ReadinessResponseDto as ReadinessResponseModel,
} from './health.response';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application liveness check' })
  @ApiOkResponse({ type: LivenessResponseModel })
  getLiveness(): LivenessResponseDto {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Application readiness check' })
  @ApiOkResponse({ type: ReadinessResponseModel })
  @ApiServiceUnavailableResponse({ type: ReadinessErrorResponseDto })
  getReadiness(): Promise<ReadinessResponseDto> {
    return this.healthService.getReadiness();
  }
}

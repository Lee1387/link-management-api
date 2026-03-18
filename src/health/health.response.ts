import { ApiProperty } from '@nestjs/swagger';

class LivenessChecksResponse {
  @ApiProperty({
    description: 'Application process availability.',
    example: 'up',
  })
  application!: 'up';
}

class ReadinessChecksResponse {
  @ApiProperty({
    description: 'Database availability.',
    example: 'up',
  })
  database!: 'up';
}

class ReadinessErrorChecksResponse {
  @ApiProperty({
    description: 'Database availability.',
    example: 'down',
  })
  database!: 'down';
}

export class LivenessResponseDto {
  @ApiProperty({
    description: 'Overall liveness status.',
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    description: 'Component liveness checks.',
    type: LivenessChecksResponse,
  })
  checks!: LivenessChecksResponse;
}

export class ReadinessResponseDto {
  @ApiProperty({
    description: 'Overall readiness status.',
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    description: 'Component readiness checks.',
    type: ReadinessChecksResponse,
  })
  checks!: ReadinessChecksResponse;
}

export class ReadinessErrorResponseDto {
  @ApiProperty({
    description: 'Overall readiness status.',
    example: 'error',
  })
  status!: 'error';

  @ApiProperty({
    description: 'Component readiness checks.',
    type: ReadinessErrorChecksResponse,
  })
  checks!: ReadinessErrorChecksResponse;
}

import { ApiProperty } from '@nestjs/swagger';

export class WorkerResponseDto {
  @ApiProperty({
    description: 'ID único del trabajador',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: 'Número de cédula o documento',
    example: '1234567890'
  })
  idNumber: string;

  @ApiProperty({
    description: 'Tipo de documento',
    example: 'CEDULA'
  })
  documentType: string;

  @ApiProperty({
    description: 'Nombres del trabajador',
    example: 'Juan Carlos'
  })
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del trabajador',
    example: 'Pérez González'
  })
  lastName: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'juan.perez@chasquigo.com'
  })
  email: string;

  @ApiProperty({
    description: 'Número de teléfono',
    example: '+593987654321'
  })
  phone: string;

  @ApiProperty({
    description: 'Rol del usuario',
    example: 'WORKER'
  })
  role: string;

  @ApiProperty({
    description: 'Información de la cooperativa',
    required: false,
    example: {
      id: 1,
      name: 'Cooperativa Chasquigo'
    }
  })
  cooperative?: {
    id: number;
    name: string;
  };

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-06-29T10:00:00.000Z'
  })
  createdAt: string;
}

export class WorkersListResponseDto {
  @ApiProperty({
    description: 'Lista de trabajadores',
    type: [WorkerResponseDto]
  })
  workers: WorkerResponseDto[];

  @ApiProperty({
    description: 'Total de trabajadores encontrados',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Límite de elementos por página',
    example: 10
  })
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 3
  })
  totalPages: number;
}

import { Controller, Get, Put, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DriverTripsService } from './driver-trips.service';
import { GetDriverTripsDto } from './dto/req/get-driver-trips.dto';
import { ValidateTicketDto } from './dto/req/validate-ticket.dto';
import { DriverTripResponseDto } from './dto/res/driver-trip-response.dto';
import { TripTicketResponseDto } from './dto/res/trip-tickets-response.dto';

@ApiTags('Viajes del Conductor')
@Controller('driver-trips')
export class DriverTripsController {
    constructor(private readonly driverTripsService: DriverTripsService) { }

    @Get('driver/:driverId')
    @ApiOperation({
        summary: 'Obtener todos los viajes de un conductor',
        description: 'Retorna todos los viajes asignados a un conductor específico con estadísticas de tickets'
    })
    @ApiParam({
        name: 'driverId',
        description: 'ID del conductor',
        example: 1
    })
    @ApiQuery({
        name: 'cooperativeId',
        description: 'ID de la cooperativa (opcional)',
        required: false,
        example: 1
    })
    @ApiResponse({
        status: 200,
        description: 'Lista de viajes obtenida exitosamente',
        type: [DriverTripResponseDto]
    })
    @ApiResponse({
        status: 404,
        description: 'Conductor no encontrado'
    })
    @ApiResponse({
        status: 400,
        description: 'El conductor no está asignado a una cooperativa'
    })
    async getDriverTrips(
        @Param('driverId', ParseIntPipe) driverId: number,
        @Query('cooperativeId') cooperativeId?: string,
    ): Promise<DriverTripResponseDto[]> {
        const cooperativeIdNumber = cooperativeId ? parseInt(cooperativeId) : undefined;
        return this.driverTripsService.getDriverTrips(driverId, cooperativeIdNumber);
    }

    @Get('trip/:routeSheetId/tickets')
    @ApiOperation({
        summary: 'Obtener tickets e información de un viaje específico',
        description: 'Retorna todos los tickets asociados a una hoja de ruta específica con información detallada de pasajeros'
    })
    @ApiParam({
        name: 'routeSheetId',
        description: 'ID de la hoja de ruta',
        example: 1
    })
    @ApiResponse({
        status: 200,
        description: 'Tickets del viaje obtenidos exitosamente',
        type: [TripTicketResponseDto]
    })
    @ApiResponse({
        status: 404,
        description: 'Hoja de ruta no encontrada'
    })
    async getTripTickets(
        @Param('routeSheetId', ParseIntPipe) routeSheetId: number,
    ): Promise<TripTicketResponseDto[]> {
        return this.driverTripsService.getTripTickets(routeSheetId);
    }

    @Put('ticket/:ticketId/validate')
    @ApiOperation({
        summary: 'Validar o cambiar el estado de un ticket',
        description: 'Permite cambiar el estado de un ticket (ej: marcar como abordado) y valida el código QR si es necesario'
    })
    @ApiParam({
        name: 'ticketId',
        description: 'ID del ticket',
        example: 1
    })
    @ApiResponse({
        status: 200,
        description: 'Ticket validado exitosamente',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                ticket: { type: 'object' }
            }
        }
    })
    @ApiResponse({
        status: 404,
        description: 'Ticket no encontrado'
    })
    @ApiResponse({
        status: 400,
        description: 'Transición de estado inválida o código QR inválido'
    })
    async validateTicket(
        @Param('ticketId', ParseIntPipe) ticketId: number,
        @Body() validateTicketDto: ValidateTicketDto,
    ): Promise<{ message: string; ticket: any }> {
        return this.driverTripsService.validateTicket(
            ticketId,
            validateTicketDto.status,
            validateTicketDto.qrCode,
        );
    }
} 
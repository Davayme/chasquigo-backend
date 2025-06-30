import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetDriverTripsDto } from './dto/req/get-driver-trips.dto';
import { ValidateTicketDto } from './dto/req/validate-ticket.dto';
import { DriverTripResponseDto } from './dto/res/driver-trip-response.dto';
import { TripTicketResponseDto } from './dto/res/trip-tickets-response.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class DriverTripsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDriverTrips(driverId: number, cooperativeId?: number): Promise<DriverTripResponseDto[]> {
        // First, verify the driver exists and get their cooperative
        const driver = await this.prisma.user.findFirst({
            where: {
                id: driverId,
                role: 'DRIVER',
                isDeleted: false,
            },
            include: {
                cooperative: true,
            },
        });

        if (!driver) {
            throw new NotFoundException('Conductor no encontrado');
        }

        // Use driver's cooperative if not specified
        const targetCooperativeId = cooperativeId || driver.cooperativeId;

        if (!targetCooperativeId) {
            throw new BadRequestException('El conductor no está asignado a una cooperativa');
        }

        // Get route sheets for the driver's cooperative
        const routeSheets = await this.prisma.routeSheetHeader.findMany({
            where: {
                cooperativeId: targetCooperativeId,
                status: 'ACTIVE',
                isDeleted: false,
            },
            include: {
                routeSheetDetails: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        frequency: {
                            include: {
                                originCity: true,
                                destinationCity: true,
                            },
                        },
                        bus: {
                            include: {
                                busType: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        // Get cooperative information separately
        const cooperative = await this.prisma.cooperative.findFirst({
            where: {
                id: targetCooperativeId,
                isDeleted: false,
            },
        });

        if (!cooperative) {
            throw new NotFoundException('Cooperativa no encontrada');
        }

        const result: DriverTripResponseDto[] = [];

        for (const routeSheet of routeSheets) {
            for (const detail of routeSheet.routeSheetDetails) {
                // Get ticket statistics for this trip
                const tickets = await this.prisma.ticket.findMany({
                    where: {
                        frequencyId: detail.frequencyId,
                        busId: detail.busId,
                        isDeleted: false,
                    },
                });

                const totalTickets = tickets.length;
                const boardedTickets = tickets.filter(t => t.status === 'BOARDED').length;
                const pendingTickets = tickets.filter(t => t.status === 'PAID' || t.status === 'CONFIRMED').length;

                result.push({
                    id: routeSheet.id,
                    cooperativeId: routeSheet.cooperativeId,
                    cooperativeName: cooperative.name,
                    startDate: routeSheet.startDate,
                    status: routeSheet.status,
                    frequency: {
                        id: detail.frequency.id,
                        originCity: detail.frequency.originCity.name,
                        destinationCity: detail.frequency.destinationCity.name,
                        departureTime: detail.frequency.departureTime.toTimeString().slice(0, 5),
                        antResolution: detail.frequency.antResolution,
                    },
                    bus: {
                        id: detail.bus.id,
                        licensePlate: detail.bus.licensePlate,
                        chassisBrand: detail.bus.chassisBrand,
                        bodyworkBrand: detail.bus.bodyworkBrand,
                        busType: {
                            name: detail.bus.busType.name,
                            seatsFloor1: detail.bus.busType.seatsFloor1,
                            seatsFloor2: detail.bus.busType.seatsFloor2,
                        },
                    },
                    totalTickets,
                    boardedTickets,
                    pendingTickets,
                });
            }
        }

        return result;
    }

    async getTripTickets(routeSheetId: number): Promise<TripTicketResponseDto[]> {
        // Get route sheet details
        const routeSheet = await this.prisma.routeSheetHeader.findFirst({
            where: {
                id: routeSheetId,
                isDeleted: false,
            },
            include: {
                routeSheetDetails: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        frequency: {
                            include: {
                                originCity: true,
                                destinationCity: true,
                            },
                        },
                    },
                },
            },
        });

        if (!routeSheet) {
            throw new NotFoundException('Hoja de ruta no encontrada');
        }

        // Get all tickets for this route sheet
        const tickets = await this.prisma.ticket.findMany({
            where: {
                frequencyId: {
                    in: routeSheet.routeSheetDetails.map(d => d.frequencyId),
                },
                isDeleted: false,
            },
            include: {
                originStop: true,
                destinationStop: true,
                buyer: true,
                ticketPassengers: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        passenger: true,
                        seat: true,
                    },
                },
            },
            orderBy: {
                purchaseDate: 'desc',
            },
        });

        return tickets.map(ticket => ({
            id: ticket.id,
            status: ticket.status,
            qrCode: ticket.qrCode,
            purchaseDate: ticket.purchaseDate,
            boardingTime: ticket.boardingTime,
            scanCount: ticket.scanCount,
            lastScanTime: ticket.lastScanTime,
            passengerCount: ticket.passengerCount,
            finalTotalPrice: Number(ticket.finalTotalPrice),
            originCity: ticket.originStop.name,
            destinationCity: ticket.destinationStop.name,
            passengers: ticket.ticketPassengers.map(passenger => ({
                id: passenger.passenger.id,
                firstName: passenger.passenger.firstName,
                lastName: passenger.passenger.lastName,
                seatNumber: passenger.seat.number,
                seatType: passenger.seatType,
                passengerType: passenger.passengerType,
                finalPrice: Number(passenger.finalPrice),
            })),
            buyer: {
                id: ticket.buyer.id,
                firstName: ticket.buyer.firstName,
                lastName: ticket.buyer.lastName,
                email: ticket.buyer.email,
                phone: ticket.buyer.phone,
            },
        }));
    }

    async validateTicket(ticketId: number, status: TicketStatus, qrCode?: string): Promise<{ message: string; ticket: any }> {
        const ticket = await this.prisma.ticket.findFirst({
            where: {
                id: ticketId,
                isDeleted: false,
            },
            include: {
                buyer: true,
                ticketPassengers: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        passenger: true,
                        seat: true,
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket no encontrado');
        }

        // Validate ticket status transitions
        if (!this.isValidStatusTransition(ticket.status, status)) {
            throw new BadRequestException(`Transición de estado inválida: ${ticket.status} -> ${status}`);
        }

        // If boarding, validate QR code
        if (status === 'BOARDED' && qrCode && ticket.qrCode !== qrCode) {
            throw new BadRequestException('Código QR inválido');
        }

        // Update ticket
        const updateData: any = {
            status,
            scanCount: ticket.scanCount + 1,
            lastScanTime: new Date(),
        };

        if (status === 'BOARDED' && !ticket.boardingTime) {
            updateData.boardingTime = new Date();
        }

        const updatedTicket = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: updateData,
            include: {
                buyer: true,
                ticketPassengers: {
                    where: {
                        isDeleted: false,
                    },
                    include: {
                        passenger: true,
                        seat: true,
                    },
                },
            },
        });

        return {
            message: `Ticket ${status === 'BOARDED' ? 'abordado' : 'actualizado'} exitosamente`,
            ticket: {
                id: updatedTicket.id,
                status: updatedTicket.status,
                qrCode: updatedTicket.qrCode,
                boardingTime: updatedTicket.boardingTime,
                scanCount: updatedTicket.scanCount,
                lastScanTime: updatedTicket.lastScanTime,
                passengerCount: updatedTicket.passengerCount,
                finalTotalPrice: Number(updatedTicket.finalTotalPrice),
                passengers: updatedTicket.ticketPassengers.map(passenger => ({
                    firstName: passenger.passenger.firstName,
                    lastName: passenger.passenger.lastName,
                    seatNumber: passenger.seat.number,
                    seatType: passenger.seatType,
                    passengerType: passenger.passengerType,
                })),
                buyer: {
                    firstName: updatedTicket.buyer.firstName,
                    lastName: updatedTicket.buyer.lastName,
                },
            },
        };
    }

    private isValidStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
        const validTransitions = {
            'PENDING': ['PAID', 'CANCELLED'],
            'PAID': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['BOARDED', 'CANCELLED'],
            'BOARDED': ['USED', 'CANCELLED'],
            'USED': [], // No more transitions allowed
            'CANCELLED': [], // No more transitions allowed
            'EXPIRED': [], // No more transitions allowed
        };

        return validTransitions[currentStatus]?.includes(newStatus) || false;
    }
} 
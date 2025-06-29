import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { BusSeatsResponse } from "../dto/res/bus-seats-response.dto";
import { PrismaErrorHandler } from "src/common/filters/prisma-errors";


@Injectable()

export class FrequenciesBusesService {
    constructor(private readonly prisma: PrismaService) {
    }

    private formatTime(date: Date): string {
        return date.toTimeString().split(' ')[0]; // Obtiene solo HH:MM:SS
    }
    async getBusSeats(routeSheetDetailId: number): Promise<BusSeatsResponse> {
        try {
            console.log(`Obteniendo asientos para routeSheetDetailId: ${routeSheetDetailId}`);

            // Obtener información de la ruta y el bus
            const routeSheetDetail = await this.prisma.routeSheetDetail.findUnique({
                where: {
                    id: routeSheetDetailId,
                    isDeleted: false,
                },
                include: {
                    bus: {
                        include: {
                            busType: true,
                            seats: {
                                where: { isDeleted: false },
                                orderBy: { number: 'asc' },
                            },
                        },
                    },
                    frequency: {
                        include: {
                            originCity: true,
                            destinationCity: true,
                        },
                    },
                    ticket: {
                        where: {
                            isDeleted: false,
                            status: { in: ['activo', 'confirmado'] } // Solo tickets válidos
                        },
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!routeSheetDetail) {
                throw new NotFoundException('Ruta no encontrada');
            }

            const { bus, frequency, ticket: tickets } = routeSheetDetail;

            // Crear mapa de asientos ocupados
            const occupiedSeats = new Map();
            tickets.forEach((ticket) => {
                occupiedSeats.set(ticket.seatId, {
                    ticketId: ticket.id,
                    passengerType: ticket.passengerType,
                    passengerName: `${ticket.user.firstName} ${ticket.user.lastName}`,
                });
            });

            // Organizar asientos por piso
            const seatsLayout = this.organizeSeatsLayout(
                bus.seats,
                occupiedSeats,
                bus.busType.floorCount,
                bus.busType.capacity
            );

            // Calcular disponibilidad
            const availability = this.calculateSeatAvailability(bus.seats, occupiedSeats);

            return {
                busInfo: {
                    id: bus.id,
                    licensePlate: bus.licensePlate,
                    chassisBrand: bus.chassisBrand,
                    bodyworkBrand: bus.bodyworkBrand,
                    photo: bus.photo,
                    busType: {
                        id: bus.busType.id,
                        name: bus.busType.name,
                        floorCount: bus.busType.floorCount,
                        capacity: bus.busType.capacity,
                    },
                },
                routeInfo: {
                    routeSheetDetailId: routeSheetDetail.id,
                    date: routeSheetDetail.date.toISOString().split('T')[0],
                    frequency: {
                        id: frequency.id,
                        departureTime: this.formatTime(frequency.departureTime),
                        originCity: frequency.originCity.name,
                        destinationCity: frequency.destinationCity.name,
                    },
                },
                seatsLayout,
                availability,
            };
        } catch (error) {
            console.error('Error getting bus seats:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            PrismaErrorHandler.handleError(error, 'Obtener Asientos del Bus');
        }
    }

    /**
     * Organiza los asientos por piso
     */
    private organizeSeatsLayout(
        seats: any[],
        occupiedSeats: Map<number, any>,
        floorCount: number,
        totalCapacity: number
    ) {
        const seatsLayout = [];

        // Calcular asientos por piso
        const seatsPerFloor = floorCount > 1 ? Math.ceil(totalCapacity / floorCount) : totalCapacity;

        console.log(`Organizando ${seats.length} asientos en ${floorCount} piso(s). Asientos por piso: ${seatsPerFloor}`);

        // Crear estructura por piso
        for (let floor = 1; floor <= floorCount; floor++) {
            const floorSeats = seats
                .filter((seat) => {
                    return this.getSeatFloor(seat.number, floorCount, seatsPerFloor) === floor;
                })
                .map((seat) => {
                    const isOccupied = occupiedSeats.has(seat.id);
                    return {
                        id: seat.id,
                        number: seat.number,
                        type: seat.type,
                        location: seat.location,
                        isOccupied,
                        ...(isOccupied && { occupiedBy: occupiedSeats.get(seat.id) }),
                    };
                })
                .sort((a, b) => {
                    // Ordenar por número de asiento
                    const numA = this.extractSeatNumber(a.number);
                    const numB = this.extractSeatNumber(b.number);
                    return numA - numB;
                });

            seatsLayout.push({
                floor,
                seats: floorSeats,
            });
        }

        return seatsLayout;
    }

    /**
     * Determina el piso de un asiento basado en su número
     */
    private getSeatFloor(seatNumber: string, floorCount: number, seatsPerFloor: number): number {
        if (floorCount === 1) return 1;

        // Extraer número del asiento (ej: "1A" -> 1, "12B" -> 12)
        const num = this.extractSeatNumber(seatNumber);

        if (isNaN(num)) return 1;

        // ✅ Dividir por piso: si son 2 pisos y 40 asientos total
        // Piso 1: asientos 1-20, Piso 2: asientos 21-40
        return Math.ceil(num / seatsPerFloor);
    }

    /**
     * Extrae el número de un asiento (ej: "1A" -> 1, "12B" -> 12)
     */
    private extractSeatNumber(seatNumber: string): number {
        const match = seatNumber.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Calcula la disponibilidad de asientos
     */
    private calculateSeatAvailability(seats: any[], occupiedSeats: Map<number, any>) {
        const normalSeats = seats.filter((seat) => seat.type === 'NORMAL');
        const vipSeats = seats.filter((seat) => seat.type === 'VIP');

        const normalOccupied = normalSeats.filter((seat) => occupiedSeats.has(seat.id)).length;
        const vipOccupied = vipSeats.filter((seat) => occupiedSeats.has(seat.id)).length;

        return {
            normal: {
                total: normalSeats.length,
                available: normalSeats.length - normalOccupied,
                occupied: normalOccupied,
            },
            vip: {
                total: vipSeats.length,
                available: vipSeats.length - vipOccupied,
                occupied: vipOccupied,
            },
        };
    }

    /**
     * Servicio MOCK para pruebas de asientos
     */
    async getBusSeatsMock(routeSheetDetailId: number): Promise<BusSeatsResponse> {
        console.log(`Obteniendo asientos MOCK para routeSheetDetailId: ${routeSheetDetailId}`);

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 300));

        // Datos mock para bus de 2 pisos
        const mockSeatsFloor1 = [];
        const mockSeatsFloor2 = [];

        // Generar asientos piso 1 (1-20)
        for (let i = 1; i <= 20; i++) {
            const letter = i % 4 <= 2 ? 'A' : 'B'; // Alternar A/B
            const isWindow = i % 4 === 1 || i % 4 === 0;
            const isVip = i >= 17; // Últimos 4 asientos VIP
            const isOccupied = Math.random() > 0.7; // 30% ocupados

            mockSeatsFloor1.push({
                id: i,
                number: `${i}${letter}`,
                type: isVip ? 'VIP' : 'NORMAL',
                location: isWindow ? 'ventana' : 'pasillo',
                isOccupied,
                ...(isOccupied && {
                    occupiedBy: {
                        ticketId: i * 100,
                        passengerType: 'NORMAL',
                        passengerName: `Pasajero ${i}`,
                    },
                }),
            });
        }

        // Generar asientos piso 2 (21-40)
        for (let i = 21; i <= 40; i++) {
            const letter = i % 4 <= 2 ? 'A' : 'B';
            const isWindow = i % 4 === 1 || i % 4 === 0;
            const isVip = i >= 37; // Últimos 4 asientos VIP
            const isOccupied = Math.random() > 0.8; // 20% ocupados

            mockSeatsFloor2.push({
                id: i,
                number: `${i}${letter}`,
                type: isVip ? 'VIP' : 'NORMAL',
                location: isWindow ? 'ventana' : 'pasillo',
                isOccupied,
                ...(isOccupied && {
                    occupiedBy: {
                        ticketId: i * 100,
                        passengerType: 'NORMAL',
                        passengerName: `Pasajero ${i}`,
                    },
                }),
            });
        }

        const allSeats = [...mockSeatsFloor1, ...mockSeatsFloor2];
        const normalSeats = allSeats.filter(s => s.type === 'NORMAL');
        const vipSeats = allSeats.filter(s => s.type === 'VIP');
        const normalOccupied = normalSeats.filter(s => s.isOccupied).length;
        const vipOccupied = vipSeats.filter(s => s.isOccupied).length;

        return {
            busInfo: {
                id: 1,
                licensePlate: 'ABC-123',
                chassisBrand: 'Mercedes-Benz',
                bodyworkBrand: 'Marcopolo',
                photo: 'https://example.com/bus-photo.jpg',
                busType: {
                    id: 2,
                    name: 'Premium Doble Piso',
                    floorCount: 2,
                    capacity: 40,
                },
            },
            routeInfo: {
                routeSheetDetailId,
                date: '2025-06-23',
                frequency: {
                    id: 1,
                    departureTime: '08:30:00',
                    originCity: 'Quito',
                    destinationCity: 'Guayaquil',
                },
            },
            seatsLayout: [
                {
                    floor: 1,
                    seats: mockSeatsFloor1,
                },
                {
                    floor: 2,
                    seats: mockSeatsFloor2,
                },
            ],
            availability: {
                normal: {
                    total: normalSeats.length,
                    available: normalSeats.length - normalOccupied,
                    occupied: normalOccupied,
                },
                vip: {
                    total: vipSeats.length,
                    available: vipSeats.length - vipOccupied,
                    occupied: vipOccupied,
                },
            },
        };
    }

}
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { BusSeatsResponse } from "../dto/res/bus-seats-response.dto";

@Injectable()
export class FrequenciesBusesService {
    constructor(private readonly prisma: PrismaService) {}

    private formatTime(date: Date): string {
        return date.toTimeString().split(' ')[0]; // Obtiene solo HH:MM:SS
    }

    async getBusSeats(routeSheetDetailId: number): Promise<BusSeatsResponse> {
        try {
            console.log(`🔍 Obteniendo asientos para routeSheetDetailId: ${routeSheetDetailId}`);

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
                            routePrice: true, // ✅ AGREGADO: Incluir precios de la ruta
                        },
                    },
                    routeSheetHeader: true, // ✅ CORREGIDO: Incluir header para obtener fecha
                },
            });

            if (!routeSheetDetail) {
                throw new NotFoundException('Ruta no encontrada');
            }

            // ✅ CORREGIDO: Consulta separada para obtener tickets ocupados
            // Usar busId y frequencyId en lugar de routeSheetId que no existe
            const occupiedTicketPassengers = await this.prisma.ticketPassenger.findMany({
                where: {
                    ticket: {
                        busId: routeSheetDetail.busId,
                        frequencyId: routeSheetDetail.frequencyId,
                        status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'BOARDED'] },
                        isDeleted: false,
                    },
                    isDeleted: false,
                },
                include: {
                    passenger: true,
                    seat: true,
                    ticket: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
            });

            console.log(`🎫 Pasajeros ocupados encontrados: ${occupiedTicketPassengers.length}`);

            // Crear mapa de asientos ocupados
            const occupiedSeats = new Map();
            occupiedTicketPassengers.forEach((ticketPassenger) => {
                occupiedSeats.set(ticketPassenger.seatId, {
                    ticketId: ticketPassenger.ticket.id,
                    ticketPassengerId: ticketPassenger.id,
                    passengerType: ticketPassenger.passengerType,
                    passengerName: `${ticketPassenger.passenger.firstName} ${ticketPassenger.passenger.lastName}`,
                    ticketStatus: ticketPassenger.ticket.status,
                    seatType: ticketPassenger.seatType,
                });
            });

            const { bus, frequency, routeSheetHeader } = routeSheetDetail;

            console.log(`💺 Total asientos en bus: ${bus.seats.length}`);
            console.log(`🎫 Total asientos ocupados: ${occupiedSeats.size}`);

            // ✅ CORREGIDO: Calcular capacity desde busType
            const totalCapacity = bus.busType.seatsFloor1 + bus.busType.seatsFloor2;

            // Organizar asientos por piso
            const seatsLayout = this.organizeSeatsLayout(
                bus.seats,
                occupiedSeats,
                bus.busType.floorCount,
                totalCapacity
            );

            // Calcular disponibilidad
            const availability = this.calculateSeatAvailability(bus.seats, occupiedSeats);

            // ✅ AGREGADO: Calcular precios de los asientos
            const pricing = this.calculatePricing(frequency.routePrice);

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
                        capacity: totalCapacity, // ✅ Calculado dinámicamente
                    },
                },
                routeInfo: {
                    routeSheetDetailId: routeSheetDetail.id,
                    date: routeSheetHeader?.startDate 
                        ? routeSheetHeader.startDate.toISOString().split('T')[0] 
                        : new Date().toISOString().split('T')[0], // ✅ Usar fecha del header
                    frequency: {
                        id: frequency.id,
                        departureTime: this.formatTime(frequency.departureTime),
                        originCity: frequency.originCity.name,
                        destinationCity: frequency.destinationCity.name,
                    },
                },
                seatsLayout,
                availability,
                pricing, // ✅ AGREGADO: Información de precios
            };
        } catch (error) {
            console.error('❌ Error getting bus seats:', error);
            console.error('Error details:', error.message);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new Error(`Error al obtener asientos: ${error.message}`);
        }
    }

    /**
     * ✅ MÉTODO ALTERNATIVO: Consulta directa si hay problemas con las relaciones
     */
    async getBusSeatsAlternative(routeSheetDetailId: number): Promise<BusSeatsResponse> {
        try {
            console.log(`🔍 [ALTERNATIVO] Obteniendo asientos para routeSheetDetailId: ${routeSheetDetailId}`);

            // 1. Obtener información básica de la ruta
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
                            routePrice: true, // ✅ AGREGADO: Incluir precios de la ruta
                        },
                    },
                    routeSheetHeader: true,
                },
            });

            if (!routeSheetDetail) {
                throw new NotFoundException('Ruta no encontrada');
            }

            // 2. ✅ CORREGIDO: Usar busId + frequencyId para encontrar tickets
            const occupiedTicketPassengers = await this.prisma.ticketPassenger.findMany({
                where: {
                    ticket: {
                        busId: routeSheetDetail.busId,
                        frequencyId: routeSheetDetail.frequencyId,
                        status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'BOARDED'] },
                        isDeleted: false,
                    },
                    isDeleted: false,
                },
                include: {
                    passenger: true,
                    seat: true,
                    ticket: {
                        select: {
                            id: true,
                            status: true,
                        },
                    },
                },
            });

            console.log(`🎫 Pasajeros ocupados encontrados: ${occupiedTicketPassengers.length}`);

            // 3. Crear mapa de asientos ocupados
            const occupiedSeats = new Map();
            occupiedTicketPassengers.forEach((ticketPassenger) => {
                occupiedSeats.set(ticketPassenger.seatId, {
                    ticketId: ticketPassenger.ticket.id,
                    ticketPassengerId: ticketPassenger.id,
                    passengerType: ticketPassenger.passengerType,
                    passengerName: `${ticketPassenger.passenger.firstName} ${ticketPassenger.passenger.lastName}`,
                    ticketStatus: ticketPassenger.ticket.status,
                    seatType: ticketPassenger.seatType,
                });
            });

            const { bus, frequency, routeSheetHeader } = routeSheetDetail;

            console.log(`💺 Total asientos en bus: ${bus.seats.length}`);
            console.log(`🎫 Total asientos ocupados: ${occupiedSeats.size}`);

            // ✅ CORREGIDO: Calcular capacity desde busType
            const totalCapacity = bus.busType.seatsFloor1 + bus.busType.seatsFloor2;

            // 4. Organizar asientos por piso
            const seatsLayout = this.organizeSeatsLayout(
                bus.seats,
                occupiedSeats,
                bus.busType.floorCount,
                totalCapacity
            );

            // 5. Calcular disponibilidad
            const availability = this.calculateSeatAvailability(bus.seats, occupiedSeats);

            // ✅ AGREGADO: Calcular precios de los asientos
            const pricing = this.calculatePricing(frequency.routePrice);

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
                        capacity: totalCapacity,
                    },
                },
                routeInfo: {
                    routeSheetDetailId: routeSheetDetail.id,
                    date: routeSheetHeader?.startDate 
                        ? routeSheetHeader.startDate.toISOString().split('T')[0] 
                        : new Date().toISOString().split('T')[0],
                    frequency: {
                        id: frequency.id,
                        departureTime: this.formatTime(frequency.departureTime),
                        originCity: frequency.originCity.name,
                        destinationCity: frequency.destinationCity.name,
                    },
                },
                seatsLayout,
                availability,
                pricing, // ✅ AGREGADO: Información de precios
            };
        } catch (error) {
            console.error('❌ Error getting bus seats (alternative):', error);
            throw new Error(`Error al obtener asientos: ${error.message}`);
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

        console.log(`🏢 Organizando ${seats.length} asientos en ${floorCount} piso(s).`);

        for (let floor = 1; floor <= floorCount; floor++) {
            const floorSeats = seats
                .filter((seat) => {
                    // ✅ CORREGIDO: Usar el campo floor del asiento directamente
                    return seat.floor === floor;
                })
                .map((seat) => {
                    const isOccupied = occupiedSeats.has(seat.id);
                    const occupiedInfo = occupiedSeats.get(seat.id);
                    
                    return {
                        id: seat.id,
                        number: seat.number.toString(), // ✅ Convertir a string
                        type: seat.type,
                        location: seat.location,
                        isOccupied,
                        ...(isOccupied && { 
                            occupiedBy: {
                                ticketId: occupiedInfo.ticketId,
                                ticketPassengerId: occupiedInfo.ticketPassengerId,
                                passengerType: occupiedInfo.passengerType,
                                passengerName: occupiedInfo.passengerName,
                                ticketStatus: occupiedInfo.ticketStatus,
                            }
                        }),
                    };
                })
                .sort((a, b) => {
                    const numA = parseInt(a.number);
                    const numB = parseInt(b.number);
                    return numA - numB;
                });

            seatsLayout.push({
                floor,
                seats: floorSeats,
            });
        }

        return seatsLayout;
    }

    private getSeatFloor(seatNumber: string, floorCount: number, seatsPerFloor: number): number {
        if (floorCount === 1) return 1;
        const num = this.extractSeatNumber(seatNumber);
        if (isNaN(num)) return 1;
        return Math.ceil(num / seatsPerFloor);
    }

    private extractSeatNumber(seatNumber: string): number {
        const match = seatNumber.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    private calculateSeatAvailability(seats: any[], occupiedSeats: Map<number, any>) {
        const normalSeats = seats.filter((seat) => seat.type === 'NORMAL');
        const vipSeats = seats.filter((seat) => seat.type === 'VIP');
        const normalOccupied = normalSeats.filter((seat) => occupiedSeats.has(seat.id)).length;
        const vipOccupied = vipSeats.filter((seat) => occupiedSeats.has(seat.id)).length;

        console.log(`📊 Disponibilidad - Normal: ${normalSeats.length - normalOccupied}/${normalSeats.length}, VIP: ${vipSeats.length - vipOccupied}/${vipSeats.length}`);

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
     * ✅ MÉTODO SIMPLIFICADO para obtener solo asientos disponibles
     */
    async getAvailableSeats(routeSheetDetailId: number) {
        try {
            console.log(`🔍 Obteniendo asientos disponibles para: ${routeSheetDetailId}`);

            // Obtener todos los asientos del bus
            const routeSheetDetail = await this.prisma.routeSheetDetail.findUnique({
                where: { id: routeSheetDetailId, isDeleted: false },
                include: {
                    bus: {
                        include: {
                            seats: {
                                where: { isDeleted: false },
                                orderBy: { number: 'asc' },
                            },
                        },
                    },
                },
            });

            if (!routeSheetDetail) {
                throw new NotFoundException('Ruta no encontrada');
            }

            // ✅ CORREGIDO: Obtener asientos ocupados usando busId + frequencyId
            const occupiedSeatIds = await this.prisma.ticketPassenger.findMany({
                where: {
                    ticket: {
                        busId: routeSheetDetail.busId,
                        frequencyId: routeSheetDetail.frequencyId,
                        status: { in: ['PENDING', 'PAID', 'CONFIRMED', 'BOARDED'] },
                        isDeleted: false,
                    },
                    isDeleted: false,
                },
                select: { seatId: true },
            });

            const occupiedIds = new Set(occupiedSeatIds.map(tp => tp.seatId));

            // Filtrar asientos disponibles
            const availableSeats = routeSheetDetail.bus.seats
                .filter(seat => !occupiedIds.has(seat.id))
                .map(seat => ({
                    id: seat.id,
                    number: seat.number,
                    type: seat.type,
                    location: seat.location,
                }));

            console.log(`✅ Asientos disponibles: ${availableSeats.length}/${routeSheetDetail.bus.seats.length}`);

            return {
                routeSheetDetailId,
                totalSeats: routeSheetDetail.bus.seats.length,
                availableSeats: availableSeats.length,
                seats: availableSeats,
            };
        } catch (error) {
            console.error('❌ Error getting available seats:', error);
            throw error;
        }
    }

    // Mock method unchanged...
    async getBusSeatsMock(routeSheetDetailId: number): Promise<BusSeatsResponse> {
        // ... código del mock sin cambios
        return this.generateMockResponse(routeSheetDetailId);
    }

    private generateMockResponse(routeSheetDetailId: number): BusSeatsResponse {
        // Generar datos mock simples para debugging
        return {
            busInfo: {
                id: 1,
                licensePlate: 'MOCK-123',
                chassisBrand: 'Mercedes-Benz',
                bodyworkBrand: 'Marcopolo',
                photo: null,
                busType: {
                    id: 1,
                    name: 'Bus Estándar',
                    floorCount: 1,
                    capacity: 40,
                },
            },
            routeInfo: {
                routeSheetDetailId,
                date: new Date().toISOString().split('T')[0],
                frequency: {
                    id: 1,
                    departureTime: '08:00:00',
                    originCity: 'Ciudad A',
                    destinationCity: 'Ciudad B',
                },
            },
            seatsLayout: [
                {
                    floor: 1,
                    seats: [
                        {
                            id: 1,
                            number: '1', // ✅ Número como string
                            type: 'NORMAL',
                            location: 'WINDOW_LEFT',
                            isOccupied: false,
                        },
                        {
                            id: 2,
                            number: '2', // ✅ Número como string
                            type: 'NORMAL',
                            location: 'AISLE_LEFT',
                            isOccupied: false,
                        },
                    ],
                },
            ],
            availability: {
                normal: { total: 2, available: 2, occupied: 0 },
                vip: { total: 0, available: 0, occupied: 0 },
            },
            pricing: {
                normalSeat: {
                    basePrice: 25.0,
                    discounts: {
                        CHILD: 12.5,
                        SENIOR: 18.75,
                        HANDICAPPED: 12.5,
                    },
                },
                vipSeat: {
                    basePrice: 35.0,
                    discounts: {
                        CHILD: 17.5,
                        SENIOR: 26.25,
                        HANDICAPPED: 17.5,
                    },
                },
            },
        };
    }

    /**
     * Calcula los precios con descuentos para asientos normales y VIP
     */
    private calculatePricing(routePrice: any) {
        if (!routePrice) {
            // Precios por defecto si no hay configuración
            return {
                normalSeat: {
                    basePrice: 25.0,
                    discounts: {
                        CHILD: 12.5,
                        SENIOR: 18.75,
                        HANDICAPPED: 12.5,
                    },
                },
                vipSeat: {
                    basePrice: 35.0,
                    discounts: {
                        CHILD: 17.5,
                        SENIOR: 26.25,
                        HANDICAPPED: 17.5,
                    },
                },
            };
        }

        const normalPrice = parseFloat(routePrice.normalPrice.toString());
        const vipPrice = parseFloat(routePrice.vipPrice.toString());

        const childDiscountPercent = parseFloat(
            routePrice.childDiscount.toString(),
        );
        const seniorDiscountPercent = parseFloat(
            routePrice.seniorDiscount.toString(),
        );
        const handicappedDiscountPercent = parseFloat(
            routePrice.handicappedDiscount.toString(),
        );

        return {
            normalSeat: {
                basePrice: normalPrice,
                discounts: {
                    CHILD: normalPrice * (1 - childDiscountPercent / 100),
                    SENIOR: normalPrice * (1 - seniorDiscountPercent / 100),
                    HANDICAPPED: normalPrice * (1 - handicappedDiscountPercent / 100),
                },
            },
            vipSeat: {
                basePrice: vipPrice,
                discounts: {
                    CHILD: vipPrice * (1 - childDiscountPercent / 100),
                    SENIOR: vipPrice * (1 - seniorDiscountPercent / 100),
                    HANDICAPPED: vipPrice * (1 - handicappedDiscountPercent / 100),
                },
            },
        };
    }
}
import { Injectable } from '@nestjs/common';
import { CreateFrequencyDto } from '../dto/req/create-frequency.dto';
import { UpdateFrequencyDto } from '../dto/req/update-frequency.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrorHandler } from 'src/common/filters/prisma-errors';
import { RouteSearchResponse } from '../dto/res/route-search-response';
import { SearchRoutesDto } from '../dto/req/search-route.dto';

@Injectable()
export class FrequenciesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFrequencyDto: CreateFrequencyDto) {
    const { departureTime, status, ...rest } = createFrequencyDto;
    const departureTimeDate = this.timeStringToDate(departureTime);
    return this.prisma.frequency
      .create({ data: { ...rest, departureTime: departureTimeDate } })
      .catch((error) => {
        PrismaErrorHandler.handleError(error, 'Crear Frecuencia');
      });
  }

  async findAllByCooperative(cooperativeId: number) {
    return this.prisma.frequency
      .findMany({
        where: { cooperativeId, isDeleted: false },
        include: {
          originCity: true,
          destinationCity: true,
        },
      })
      .catch((error) => {
        PrismaErrorHandler.handleError(
          error,
          'Buscar Frecuencias por Cooperativa',
        );
      });
  }

  async findOne(id: number) {
    return this.prisma.frequency
      .findUnique({ where: { id, isDeleted: false } })
      .catch((error) => {
        PrismaErrorHandler.handleError(error, 'Buscar Frecuencia por ID');
      });
  }

  async update(id: number, updateFrequencyDto: UpdateFrequencyDto) {
    const { departureTime, ...rest } = updateFrequencyDto;
    const departureTimeDate = this.timeStringToDate(departureTime);
    return this.prisma.frequency
      .update({
        where: { id },
        data: { ...rest, departureTime: departureTimeDate },
      })
      .catch((error) => {
        PrismaErrorHandler.handleError(error, 'Actualizar Frecuencia');
      });
  }

  async remove(id: number) {
    return this.prisma.frequency
      .update({ where: { id }, data: { isDeleted: true } })
      .catch((error) => {
        PrismaErrorHandler.handleError(error, 'Eliminar Frecuencia');
      });
  }

  private timeStringToDate(timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // async searchRoutes(
  //   searchRoutesDto: SearchRoutesDto,
  // ): Promise<RouteSearchResponse[]> {
  //   const { originCityId, destinationCityId, date } = searchRoutesDto;

  //   // Convertir la fecha considerando la zona horaria de Ecuador (UTC-5)
  //   const searchDate = this.parseSearchDate(date);

  //   console.log(
  //     `Buscando rutas: ${originCityId} -> ${destinationCityId} para ${searchDate.toISOString()}`,
  //   );

  //   try {
  //     // Buscar hojas de ruta para la fecha específica
  //     const routeSheetDetails = await this.prisma.routeSheetDetail.findMany({
  //       where: {
  //         date: searchDate,
  //         isDeleted: false,
  //         status: 'activo', // Solo rutas activas
  //         frequency: {
  //           originCityId,
  //           destinationCityId,
  //           isDeleted: false,
  //           status: 'activo', // Solo frecuencias activas
  //         },
  //       },
  //       include: {
  //         frequency: {
  //           include: {
  //             originCity: true,
  //             destinationCity: true,
  //             cooperative: true,
  //             intermediateStops: {
  //               include: {
  //                 city: true,
  //               },
  //               orderBy: {
  //                 order: 'asc',
  //               },
  //             },
  //             routePrice: true,
  //           },
  //         },
  //         bus: {
  //           include: {
  //             busType: true,
  //           },
  //         },
  //         ticket: {
  //           where: {
  //             isDeleted: false,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         frequency: {
  //           departureTime: 'asc',
  //         },
  //       },
  //     });

  //     // Si no hay resultados, devolver array vacío en lugar de lanzar error
  //     if (routeSheetDetails.length === 0) {
  //       console.log('No se encontraron rutas para los criterios especificados');
  //       return []; // ✅ Devolver array vacío en lugar de lanzar error
  //     }

  //     // Mapear los resultados al formato requerido
  //     const routes: RouteSearchResponse[] = routeSheetDetails.map(
  //       (routeSheet) => {
  //         const { frequency, bus, ticket } = routeSheet;

  //         // Calcular disponibilidad de asientos
  //         const seatsAvailability = this.calculateSeatsAvailability(
  //           routeSheet,
  //           ticket,
  //         );

  //         // Obtener precios con descuentos
  //         const pricing = this.calculatePricing(frequency.routePrice);

  //         // Calcular duración estimada y hora de llegada
  //         const { duration, estimatedArrival } =
  //           this.calculateDurationAndArrival(
  //             frequency.departureTime,
  //             frequency.originCity.name,
  //             frequency.destinationCity.name,
  //           );

  //         return {
  //           routeSheetDetailId: routeSheet.id,
  //           date: routeSheet.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
  //           frequency: {
  //             id: frequency.id,
  //             departureTime: this.formatTime(frequency.departureTime),
  //             status: frequency.status,
  //             antResolution: frequency.antResolution,
  //             originCity: {
  //               id: frequency.originCity.id,
  //               name: frequency.originCity.name,
  //               province: frequency.originCity.province,
  //             },
  //             destinationCity: {
  //               id: frequency.destinationCity.id,
  //               name: frequency.destinationCity.name,
  //               province: frequency.destinationCity.province,
  //             },
  //             intermediateStops: frequency.intermediateStops.map((stop) => ({
  //               id: stop.id,
  //               order: stop.order,
  //               city: {
  //                 id: stop.city.id,
  //                 name: stop.city.name,
  //                 province: stop.city.province,
  //               },
  //             })),
  //           },
  //           bus: {
  //             id: bus.id,
  //             licensePlate: bus.licensePlate,
  //             chassisBrand: bus.chassisBrand,
  //             bodyworkBrand: bus.bodyworkBrand,
  //             photo: bus.photo,
  //             stoppageDays: bus.stoppageDays,
  //             busType: {
  //               id: bus.busType.id,
  //               name: bus.busType.name,
  //               floorCount: bus.busType.floorCount,
  //               capacity: bus.busType.capacity,
  //             },
  //           },
  //           cooperative: {
  //             id: frequency.cooperative.id,
  //             name: frequency.cooperative.name,
  //             logo: frequency.cooperative.logo,
  //             phone: frequency.cooperative.phone,
  //             email: frequency.cooperative.email,
  //           },
  //           seatsAvailability,
  //           pricing,
  //           status: routeSheet.status,
  //           duration,
  //           estimatedArrival,
  //         };
  //       },
  //     );

  //     return routes;
  //   } catch (error) {
  //     console.error('Error searching routes:', error);
  //     // Solo usar PrismaErrorHandler para errores reales de base de datos
  //     PrismaErrorHandler.handleError(error, 'Buscar Rutas');
  //   }
  // }

  // /**
  //  * Convierte la fecha de búsqueda considerando la zona horaria de Ecuador
  //  */
  // private parseSearchDate(dateString: string): Date {
  //   // Ecuador está en UTC-5, así que ajustamos la fecha
  //   const date = new Date(dateString + 'T00:00:00.000-05:00');
  //   // Convertir a UTC para almacenar en la BD
  //   return new Date(
  //     date.getUTCFullYear(),
  //     date.getUTCMonth(),
  //     date.getUTCDate(),
  //   );
  // }

  // /**
  //  * Calcula la disponibilidad de asientos
  //  */
  // private calculateSeatsAvailability(routeSheet: any, tickets: any[]) {
  //   const normalTickets = tickets.filter((t) => t.seatType === 'NORMAL').length;
  //   const vipTickets = tickets.filter((t) => t.seatType === 'VIP').length;

  //   return {
  //     normal: {
  //       available: routeSheet.availableNormalSeats,
  //       total: routeSheet.totalNormalSeats,
  //       sold: normalTickets,
  //     },
  //     vip: {
  //       available: routeSheet.availableVIPSeats,
  //       total: routeSheet.totalVIPSeats,
  //       sold: vipTickets,
  //     },
  //   };
  // }

  // /**
  //  * Calcula los precios con descuentos
  //  */
  // private calculatePricing(routePrice: any) {
  //   if (!routePrice) {
  //     // Precios por defecto si no hay configuración
  //     return {
  //       normalSeat: {
  //         basePrice: 25.0,
  //         discounts: {
  //           CHILD: 12.5,
  //           SENIOR: 18.75,
  //           HANDICAPPED: 12.5,
  //         },
  //       },
  //       vipSeat: {
  //         basePrice: 35.0,
  //         discounts: {
  //           CHILD: 17.5,
  //           SENIOR: 26.25,
  //           HANDICAPPED: 17.5,
  //         },
  //       },
  //     };
  //   }

  //   const normalPrice = parseFloat(routePrice.normalPrice.toString());
  //   const vipPrice = parseFloat(routePrice.vipPrice.toString());

  //   const childDiscountPercent = parseFloat(
  //     routePrice.childDiscount.toString(),
  //   );
  //   const seniorDiscountPercent = parseFloat(
  //     routePrice.seniorDiscount.toString(),
  //   );
  //   const handicappedDiscountPercent = parseFloat(
  //     routePrice.handicappedDiscount.toString(),
  //   );

  //   return {
  //     normalSeat: {
  //       basePrice: normalPrice,
  //       discounts: {
  //         CHILD: normalPrice * (1 - childDiscountPercent / 100),
  //         SENIOR: normalPrice * (1 - seniorDiscountPercent / 100),
  //         HANDICAPPED: normalPrice * (1 - handicappedDiscountPercent / 100),
  //       },
  //     },
  //     vipSeat: {
  //       basePrice: vipPrice,
  //       discounts: {
  //         CHILD: vipPrice * (1 - childDiscountPercent / 100),
  //         SENIOR: vipPrice * (1 - seniorDiscountPercent / 100),
  //         HANDICAPPED: vipPrice * (1 - handicappedDiscountPercent / 100),
  //       },
  //     },
  //   };
  // }

  // /**
  //  * Calcula la duración estimada y hora de llegada
  //  */
  // private calculateDurationAndArrival(
  //   departureTime: Date,
  //   originCity: string,
  //   destinationCity: string,
  // ) {
  //   // Mapeo de duraciones estimadas entre ciudades principales (en minutos)
  //   const cityDurations: { [key: string]: number } = {
  //     'Quito-Guayaquil': 270, // 4h 30min
  //     'Guayaquil-Quito': 270,
  //     'Quito-Cuenca': 300, // 5h
  //     'Cuenca-Quito': 300,
  //     'Guayaquil-Cuenca': 180, // 3h
  //     'Cuenca-Guayaquil': 180,
  //     'Quito-Ambato': 120, // 2h
  //     'Ambato-Quito': 120,
  //     'Quito-Riobamba': 150, // 2h 30min
  //     'Riobamba-Quito': 150,
  //   };

  //   const routeKey = `${originCity}-${destinationCity}`;
  //   const durationMinutes = cityDurations[routeKey] || 240; // 4h por defecto

  //   // Calcular hora de llegada
  //   const departure = new Date(departureTime);
  //   const arrival = new Date(departure.getTime() + durationMinutes * 60000);

  //   // Formatear duración
  //   const hours = Math.floor(durationMinutes / 60);
  //   const minutes = durationMinutes % 60;
  //   const duration = `${hours}h ${minutes > 0 ? minutes + 'min' : ''}`.trim();

  //   return {
  //     duration,
  //     estimatedArrival: this.formatTime(arrival),
  //   };
  // }

  // /**
  //  * Formatea una hora a HH:MM:SS
  //  */
  // private formatTime(date: Date): string {
  //   return date.toTimeString().split(' ')[0]; // Obtiene solo HH:MM:SS
  // }

  

  // async searchRoutesMock(
  //   searchRoutesDto: SearchRoutesDto,
  // ): Promise<RouteSearchResponse[]> {
  //   const { originCityId, destinationCityId, date } = searchRoutesDto;

  //   console.log(
  //     `Búsqueda MOCK: ${originCityId} -> ${destinationCityId} para ${date}`,
  //   );

  //   // Simular datos estáticos para diferentes combinaciones de ciudades
  //   const mockRoutes: RouteSearchResponse[] = [
  //     {
  //       routeSheetDetailId: 1,
  //       date: date,
  //       frequency: {
  //         id: 1,
  //         departureTime: '08:30:00',
  //         status: 'activo',
  //         antResolution: 'ANT-2025-001',
  //         originCity: {
  //           id: originCityId,
  //           name: originCityId === 1 ? 'Quito' : 'Guayaquil',
  //           province: originCityId === 1 ? 'PICHINCHA' : 'GUAYAS',
  //         },
  //         destinationCity: {
  //           id: destinationCityId,
  //           name: destinationCityId === 2 ? 'Guayaquil' : 'Quito',
  //           province: destinationCityId === 2 ? 'GUAYAS' : 'PICHINCHA',
  //         },
  //         intermediateStops: [
  //           {
  //             id: 1,
  //             order: 1,
  //             city: {
  //               id: 3,
  //               name: 'Santo Domingo',
  //               province: 'SANTO_DOMINGO_DE_LOS_TSACHILAS',
  //             },
  //           },
  //           {
  //             id: 2,
  //             order: 2,
  //             city: {
  //               id: 4,
  //               name: 'Quevedo',
  //               province: 'LOS_RIOS',
  //             },
  //           },
  //         ],
  //       },
  //       bus: {
  //         id: 1,
  //         licensePlate: 'ABC-123',
  //         chassisBrand: 'Mercedes-Benz',
  //         bodyworkBrand: 'Marcopolo',
  //         photo: 'https://example.com/bus-photo.jpg',
  //         stoppageDays: 2,
  //         busType: {
  //           id: 1,
  //           name: 'Ejecutivo',
  //           floorCount: 1,
  //           capacity: 40,
  //         },
  //       },
  //       cooperative: {
  //         id: 1,
  //         name: 'Transportes Express',
  //         logo: 'https://w7.pngwing.com/pngs/973/11/png-transparent-logo-phoenix-illustration-phoenix-logo-design-phoenix-illustration-free-logo-design-template-photography-orange-thumbnail.png',
  //         phone: '0987654321',
  //         email: 'info@transportesexpress.com',
  //       },
  //       seatsAvailability: {
  //         normal: {
  //           available: 25,
  //           total: 32,
  //           sold: 7,
  //         },
  //         vip: {
  //           available: 6,
  //           total: 8,
  //           sold: 2,
  //         },
  //       },
  //       pricing: {
  //         normalSeat: {
  //           basePrice: 25.0,
  //           discounts: {
  //             CHILD: 12.5,
  //             SENIOR: 18.75,
  //             HANDICAPPED: 12.5,
  //           },
  //         },
  //         vipSeat: {
  //           basePrice: 35.0,
  //           discounts: {
  //             CHILD: 17.5,
  //             SENIOR: 26.25,
  //             HANDICAPPED: 17.5,
  //           },
  //         },
  //       },
  //       status: 'disponible',
  //       duration: '4h 30min',
  //       estimatedArrival: '13:00:00',
  //     },
  //     {
  //       routeSheetDetailId: 2,
  //       date: date,
  //       frequency: {
  //         id: 2,
  //         departureTime: '14:00:00',
  //         status: 'activo',
  //         antResolution: 'ANT-2025-002',
  //         originCity: {
  //           id: originCityId,
  //           name: originCityId === 1 ? 'Quito' : 'Guayaquil',
  //           province: originCityId === 1 ? 'PICHINCHA' : 'GUAYAS',
  //         },
  //         destinationCity: {
  //           id: destinationCityId,
  //           name: destinationCityId === 2 ? 'Guayaquil' : 'Quito',
  //           province: destinationCityId === 2 ? 'GUAYAS' : 'PICHINCHA',
  //         },
  //         intermediateStops: [
  //           {
  //             id: 3,
  //             order: 1,
  //             city: {
  //               id: 3,
  //               name: 'Santo Domingo',
  //               province: 'SANTO_DOMINGO_DE_LOS_TSACHILAS',
  //             },
  //           },
  //         ],
  //       },
  //       bus: {
  //         id: 2,
  //         licensePlate: 'DEF-456',
  //         chassisBrand: 'Scania',
  //         bodyworkBrand: 'Busscar',
  //         photo: 'https://example.com/bus-photo2.jpg',
  //         stoppageDays: 1,
  //         busType: {
  //           id: 2,
  //           name: 'Premium',
  //           floorCount: 2,
  //           capacity: 48,
  //         },
  //       },
  //       cooperative: {
  //         id: 2,
  //         name: 'Rutas del Ecuador',
  //         logo: 'https://example.com/logo2.png',
  //         phone: '0998765432',
  //         email: 'contacto@rutasecuador.com',
  //       },
  //       seatsAvailability: {
  //         normal: {
  //           available: 30,
  //           total: 36,
  //           sold: 6,
  //         },
  //         vip: {
  //           available: 10,
  //           total: 12,
  //           sold: 2,
  //         },
  //       },
  //       pricing: {
  //         normalSeat: {
  //           basePrice: 28.0,
  //           discounts: {
  //             CHILD: 14.0,
  //             SENIOR: 21.0,
  //             HANDICAPPED: 14.0,
  //           },
  //         },
  //         vipSeat: {
  //           basePrice: 40.0,
  //           discounts: {
  //             CHILD: 20.0,
  //             SENIOR: 30.0,
  //             HANDICAPPED: 20.0,
  //           },
  //         },
  //       },
  //       status: 'disponible',
  //       duration: '4h 15min',
  //       estimatedArrival: '18:15:00',
  //     },
  //     {
  //       routeSheetDetailId: 3,
  //       date: date,
  //       frequency: {
  //         id: 3,
  //         departureTime: '20:30:00',
  //         status: 'activo',
  //         antResolution: 'ANT-2025-003',
  //         originCity: {
  //           id: originCityId,
  //           name: originCityId === 1 ? 'Quito' : 'Guayaquil',
  //           province: originCityId === 1 ? 'PICHINCHA' : 'GUAYAS',
  //         },
  //         destinationCity: {
  //           id: destinationCityId,
  //           name: destinationCityId === 2 ? 'Guayaquil' : 'Quito',
  //           province: destinationCityId === 2 ? 'GUAYAS' : 'PICHINCHA',
  //         },
  //         intermediateStops: [
  //           {
  //             id: 4,
  //             order: 1,
  //             city: {
  //               id: 5,
  //               name: 'Latacunga',
  //               province: 'COTOPAXI',
  //             },
  //           },
  //           {
  //             id: 5,
  //             order: 2,
  //             city: {
  //               id: 6,
  //               name: 'Ambato',
  //               province: 'TUNGURAHUA',
  //             },
  //           },
  //           {
  //             id: 6,
  //             order: 3,
  //             city: {
  //               id: 4,
  //               name: 'Quevedo',
  //               province: 'LOS_RIOS',
  //             },
  //           },
  //         ],
  //       },
  //       bus: {
  //         id: 3,
  //         licensePlate: 'GHI-789',
  //         chassisBrand: 'Volvo',
  //         bodyworkBrand: 'Irizar',
  //         photo: 'https://example.com/bus-photo3.jpg',
  //         stoppageDays: 0,
  //         busType: {
  //           id: 3,
  //           name: 'VIP Luxury',
  //           floorCount: 1,
  //           capacity: 32,
  //         },
  //       },
  //       cooperative: {
  //         id: 3,
  //         name: 'Viajes Cómodos S.A.',
  //         logo: 'https://w7.pngwing.com/pngs/973/11/png-transparent-logo-phoenix-illustration-phoenix-logo-design-phoenix-illustration-free-logo-design-template-photography-orange-thumbnail.png',
  //         phone: '0999887766',
  //         email: 'reservas@viajescomodos.com',
  //       },
  //       seatsAvailability: {
  //         normal: {
  //           available: 18,
  //           total: 20,
  //           sold: 2,
  //         },
  //         vip: {
  //           available: 8,
  //           total: 12,
  //           sold: 4,
  //         },
  //       },
  //       pricing: {
  //         normalSeat: {
  //           basePrice: 32.0,
  //           discounts: {
  //             CHILD: 16.0,
  //             SENIOR: 24.0,
  //             HANDICAPPED: 16.0,
  //           },
  //         },
  //         vipSeat: {
  //           basePrice: 45.0,
  //           discounts: {
  //             CHILD: 22.5,
  //             SENIOR: 33.75,
  //             HANDICAPPED: 22.5,
  //           },
  //         },
  //       },
  //       status: 'disponible',
  //       duration: '5h 00min',
  //       estimatedArrival: '01:30:00',
  //     },
  //   ];

  //   // Simular delay de red
  //   await new Promise((resolve) => setTimeout(resolve, 500));

  //   return mockRoutes;
  // }
}

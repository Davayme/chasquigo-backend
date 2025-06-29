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

  async searchRoutes(
    searchRoutesDto: SearchRoutesDto,
  ): Promise<RouteSearchResponse[]> {
    const { originCityId, destinationCityId, date } = searchRoutesDto;

    console.log(`Búsqueda original: ${originCityId} -> ${destinationCityId} para fecha: ${date}`);

    // Convertir la fecha string a Date simplificado
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate());
    const endOfDay = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate() + 1);

    console.log(`Fecha de búsqueda parseada: ${searchDate.toISOString()}`);
    console.log(`Rango de búsqueda: ${startOfDay.toISOString()} a ${endOfDay.toISOString()}`);

    try {
      // Buscar hojas de ruta para la fecha específica
      const routeSheetDetails = await this.prisma.routeSheetDetail.findMany({
        where: {
          routeSheetHeader: {
            startDate: {
              gte: startOfDay,
              lt: endOfDay,
            },
            status: 'ACTIVE', // Solo rutas activas
          },
          frequency: {
            originCityId,
            destinationCityId,
            isDeleted: false,
            status: 'ACTIVE', // Solo frecuencias activas
          },
          isDeleted: false,
        },
        include: {
          frequency: {
            include: {
              originCity: true,
              destinationCity: true,
              cooperative: true,
              intermediateStops: {
                include: {
                  city: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
              routePrice: true,
            },
          },
          bus: {
            include: {
              busType: true,
            },
          },
          routeSheetHeader: true,
        },
        orderBy: {
          frequency: {
            departureTime: 'asc',
          },
        },
      });

      console.log(`Encontrados ${routeSheetDetails.length} RouteSheetDetails`);

      // Si no hay resultados, intentar buscar solo por frecuencias activas sin requerir RouteSheetHeader
      if (routeSheetDetails.length === 0) {
        console.log('No se encontraron RouteSheetDetails, buscando frecuencias directamente...');
        
        const frequencies = await this.prisma.frequency.findMany({
          where: {
            originCityId,
            destinationCityId,
            isDeleted: false,
            status: 'ACTIVE',
          },
          include: {
            originCity: true,
            destinationCity: true,
            cooperative: true,
            intermediateStops: {
              include: {
                city: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
            routePrice: true,
          },
        });

        console.log(`Encontradas ${frequencies.length} frecuencias activas:`, frequencies.map(f => ({ id: f.id, origen: f.originCity.name, destino: f.destinationCity.name })));

        if (frequencies.length === 0) {
          console.log('No se encontraron frecuencias activas para los criterios especificados');
          return [];
        }

        // Buscar buses disponibles para estas frecuencias
        const buses = await this.prisma.bus.findMany({
          where: {
            isDeleted: false,
            cooperativeId: frequencies[0].cooperativeId, // Usar la misma cooperativa de la frecuencia
          },
          include: {
            busType: true,
          },
        });

        console.log(`Encontrados ${buses.length} buses disponibles`);

        if (buses.length === 0) {
          console.log('No hay buses disponibles para esta cooperativa');
          return [];
        }

        // Mapear frecuencias a formato de respuesta
        const routes: RouteSearchResponse[] = [];

        for (const frequency of frequencies) {
          // Usar el primer bus disponible para esta frecuencia
          const bus = buses[0];
          
          // Obtener tickets vendidos para este bus y frecuencia (aunque sea simulado)
          const soldTickets = await this.prisma.ticket.findMany({
            where: {
              busId: bus.id,
              frequencyId: frequency.id,
              isDeleted: false,
            },
          });

          console.log(`Tickets vendidos para frecuencia ${frequency.id} y bus ${bus.id}: ${soldTickets.length}`);

          // Calcular disponibilidad de asientos
          const seatsAvailability = this.calculateSeatsAvailability(
            bus.busType,
            soldTickets,
          );

          // Obtener precios con descuentos
          const pricing = this.calculatePricing(frequency.routePrice);

          // Calcular duración estimada y hora de llegada
          const { duration, estimatedArrival } =
            this.calculateDurationAndArrival(
              frequency.departureTime,
              frequency.originCity.name,
              frequency.destinationCity.name,
            );

          routes.push({
            routeSheetDetailId: null, // No hay hoja de ruta específica
            date: date, // Usar la fecha de búsqueda
            frequency: {
              id: frequency.id,
              departureTime: this.formatTime(frequency.departureTime),
              status: frequency.status,
              antResolution: frequency.antResolution,
              originCity: {
                id: frequency.originCity.id,
                name: frequency.originCity.name,
                province: frequency.originCity.province,
              },
              destinationCity: {
                id: frequency.destinationCity.id,
                name: frequency.destinationCity.name,
                province: frequency.destinationCity.province,
              },
              intermediateStops: frequency.intermediateStops.map((stop) => ({
                id: stop.id,
                order: stop.order,
                city: {
                  id: stop.city.id,
                  name: stop.city.name,
                  province: stop.city.province,
                },
              })),
            },
            bus: {
              id: bus.id,
              licensePlate: bus.licensePlate,
              chassisBrand: bus.chassisBrand,
              bodyworkBrand: bus.bodyworkBrand,
              photo: bus.photo,
              stoppageDays: 0,
              busType: {
                id: bus.busType.id,
                name: bus.busType.name,
                floorCount: bus.busType.floorCount,
                capacity: bus.busType.seatsFloor1 + bus.busType.seatsFloor2,
              },
            },
            cooperative: {
              id: frequency.cooperative.id,
              name: frequency.cooperative.name,
              logo: frequency.cooperative.logo,
              phone: frequency.cooperative.phone,
              email: frequency.cooperative.email,
            },
            seatsAvailability,
            pricing,
            status: 'ACTIVE',
            duration,
            estimatedArrival,
          });
        }

        console.log(`Devolviendo ${routes.length} rutas desde el fallback`);
        return routes;
      }

      // Mapear los resultados al formato requerido
      const routes: RouteSearchResponse[] = [];

      for (const routeSheet of routeSheetDetails) {
        const { frequency, bus } = routeSheet;

        // Obtener tickets vendidos para este bus y frecuencia en la fecha
        const soldTickets = await this.prisma.ticket.findMany({
          where: {
            busId: bus.id,
            frequencyId: frequency.id,
            isDeleted: false,
          },
        });

        // Calcular disponibilidad de asientos
        const seatsAvailability = this.calculateSeatsAvailability(
          bus.busType,
          soldTickets,
        );

        // Obtener precios con descuentos
        const pricing = this.calculatePricing(frequency.routePrice);

        // Calcular duración estimada y hora de llegada
        const { duration, estimatedArrival } =
          this.calculateDurationAndArrival(
            frequency.departureTime,
            frequency.originCity.name,
            frequency.destinationCity.name,
          );

        routes.push({
          routeSheetDetailId: routeSheet.id,
          date: routeSheet.routeSheetHeader.startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
          frequency: {
            id: frequency.id,
            departureTime: this.formatTime(frequency.departureTime),
            status: frequency.status,
            antResolution: frequency.antResolution,
            originCity: {
              id: frequency.originCity.id,
              name: frequency.originCity.name,
              province: frequency.originCity.province,
            },
            destinationCity: {
              id: frequency.destinationCity.id,
              name: frequency.destinationCity.name,
              province: frequency.destinationCity.province,
            },
            intermediateStops: frequency.intermediateStops.map((stop) => ({
              id: stop.id,
              order: stop.order,
              city: {
                id: stop.city.id,
                name: stop.city.name,
                province: stop.city.province,
              },
            })),
          },
          bus: {
            id: bus.id,
            licensePlate: bus.licensePlate,
            chassisBrand: bus.chassisBrand,
            bodyworkBrand: bus.bodyworkBrand,
            photo: bus.photo,
            stoppageDays: 0, // Campo no disponible en el nuevo esquema, valor por defecto
            busType: {
              id: bus.busType.id,
              name: bus.busType.name,
              floorCount: bus.busType.floorCount,
              capacity: bus.busType.seatsFloor1 + bus.busType.seatsFloor2,
            },
          },
          cooperative: {
            id: frequency.cooperative.id,
            name: frequency.cooperative.name,
            logo: frequency.cooperative.logo,
            phone: frequency.cooperative.phone,
            email: frequency.cooperative.email,
          },
          seatsAvailability,
          pricing,
          status: routeSheet.routeSheetHeader.status,
          duration,
          estimatedArrival,
        });
      }

      return routes;
    } catch (error) {
      console.error('Error searching routes:', error);
      // Solo usar PrismaErrorHandler para errores reales de base de datos
      PrismaErrorHandler.handleError(error, 'Buscar Rutas');
    }
  }

  /**
   * Convierte la fecha de búsqueda considerando la zona horaria de Ecuador
   */
  private parseSearchDate(dateString: string): Date {
    // Ecuador está en UTC-5, así que ajustamos la fecha
    const date = new Date(dateString + 'T00:00:00.000-05:00');
    // Convertir a UTC para almacenar en la BD
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  }

  /**
   * Calcula la disponibilidad de asientos
   */
  private calculateSeatsAvailability(busType: any, soldTickets: any[]) {
    const totalCapacity = busType.seatsFloor1 + busType.seatsFloor2;
    const soldSeats = soldTickets.length;
    
    // Por ahora, consideramos todos los asientos como "normal"
    // En el futuro se puede diferenciar por tipos de asiento si es necesario
    return {
      normal: {
        available: totalCapacity - soldSeats,
        total: totalCapacity,
        sold: soldSeats,
      },
      vip: {
        available: 0, // Por ahora no hay asientos VIP diferenciados
        total: 0,
        sold: 0,
      },
    };
  }

  /**
   * Calcula los precios con descuentos
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

  /**
   * Calcula la duración estimada y hora de llegada
   */
  private calculateDurationAndArrival(
    departureTime: Date,
    originCity: string,
    destinationCity: string,
  ) {
    // Mapeo de duraciones estimadas entre ciudades principales (en minutos)
    const cityDurations: { [key: string]: number } = {
      'Quito-Guayaquil': 270, // 4h 30min
      'Guayaquil-Quito': 270,
      'Quito-Cuenca': 300, // 5h
      'Cuenca-Quito': 300,
      'Guayaquil-Cuenca': 180, // 3h
      'Cuenca-Guayaquil': 180,
      'Quito-Ambato': 120, // 2h
      'Ambato-Quito': 120,
      'Quito-Riobamba': 150, // 2h 30min
      'Riobamba-Quito': 150,
    };

    const routeKey = `${originCity}-${destinationCity}`;
    const durationMinutes = cityDurations[routeKey] || 240; // 4h por defecto

    // Calcular hora de llegada
    const departure = new Date(departureTime);
    const arrival = new Date(departure.getTime() + durationMinutes * 60000);

    // Formatear duración
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const duration = `${hours}h ${minutes > 0 ? minutes + 'min' : ''}`.trim();

    return {
      duration,
      estimatedArrival: this.formatTime(arrival),
    };
  }

  /**
   * Formatea una hora a HH:MM:SS
   */
  private formatTime(date: Date): string {
    return date.toTimeString().split(' ')[0]; // Obtiene solo HH:MM:SS
  }

}

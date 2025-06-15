import { Injectable } from '@nestjs/common';
import { CreateIntermediateStopDto } from './dto/req/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/req/update-intermediate-stop.dto';
import axios from 'axios';
import { GetRouteCitiesDto } from './dto/req/get-route-cities.dto';
import * as polyline from '@mapbox/polyline'; // necesitas instalar esto
import { PrismaService } from 'src/prisma/prisma.service';
import { Province } from '@prisma/client';

@Injectable()
export class IntermediateStopsService {
  constructor(private readonly prisma: PrismaService) {}

  apiKey = process.env.GOOGLE_MAPS_API_KEY;
  async create(createIntermediateStopDto: CreateIntermediateStopDto) {
    const city = await this.obtenerCiudadPorNombre(createIntermediateStopDto.name);

    return this.prisma.intermediateStop.create({
      data: {
        cityId: city.id,
        frequencyId: createIntermediateStopDto.frequencyId,
        order: createIntermediateStopDto.order,
      },
    });
  }

  async findAll() {
    return this.prisma.intermediateStop.findMany(
      {
        where: {
          isDeleted: false,
        },
        include: {
          city: true,
        },
      }
    );
  }

  async findOne(id: number) {
    return this.prisma.intermediateStop.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        city: true,
      },
    });
  }

  async update(id: number, updateIntermediateStopDto: UpdateIntermediateStopDto) {
    const city = await this.obtenerCiudadPorNombre(updateIntermediateStopDto.name);
    return this.prisma.intermediateStop.update({
      where: {
        id
      },
      data: {
        cityId: city.id,
        frequencyId: updateIntermediateStopDto.frequencyId,
        order: updateIntermediateStopDto.order,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.intermediateStop.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async obtenerCiudadesIntermedias(getRouteCitiesDto: GetRouteCitiesDto) {
    const directions = await this.obtenerRuta(
      getRouteCitiesDto.origen,
      getRouteCitiesDto.destino,
    );

    const ruta = directions.routes[0];
    if (!ruta?.overview_polyline?.points) {
      throw new Error('No se pudo obtener overview_polyline');
    }

    const decodedPoints = polyline.decode(ruta.overview_polyline.points);
    const ciudades = [];
    const cache = new Map();

    for (let i = 0; i < decodedPoints.length; i += 15) {
      const [lat, lng] = decodedPoints[i];
      const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      if (cache.has(key)) continue;

      const ciudad = await this.reverseGeocoding(lat, lng);

      //console.log(ciudad);
      if (ciudad.includes('Canton')) {
        continue;
      }
      if (ciudad) {
        ciudades.push(ciudad);
        cache.set(key, ciudad);
      }
    }

    return [...new Set(ciudades)];
  }

  private async obtenerRuta(origen: string, destino: string) {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin: `${origen}, Ecuador`,
          destination: `${destino}, Ecuador`,
          key: this.apiKey,
        },
      },
    );

    return res.data;
  }

  private async reverseGeocoding(lat: number, lng: number) {
    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
          result_type: 'locality|administrative_area_level_2',
        },
      },
    );

    const results = res.data.results;
    const lugar = results.find(
      (r) =>
        r.types.includes('locality') ||
        r.types.includes('administrative_area_level_2'),
    );

    return lugar?.address_components?.[0]?.long_name ?? null;
  }

  private async obtenerCiudadPorNombre(nombre: string) {
    let city = await this.prisma.city.findUnique({
      where: { 
        name: nombre.toLowerCase(),
        isDeleted: false 
      }
    });
    
    if (!city) {
      city = await this.prisma.city.create({
        data: {
          name: nombre.toLowerCase(),
          province: Province.SIN_ASIGNAR,
        }
      });
    }
    return city;
  }
}

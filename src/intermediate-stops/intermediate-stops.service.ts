import { Injectable } from '@nestjs/common';
import { CreateIntermediateStopDto } from './dto/req/create-intermediate-stop.dto';
import { UpdateIntermediateStopDto } from './dto/req/update-intermediate-stop.dto';
import axios from 'axios';
import { GetRouteCitiesDto } from './dto/req/get-route-cities.dto';
import * as polyline from '@mapbox/polyline'; // necesitas instalar esto

@Injectable()
export class IntermediateStopsService {
  apiKey = process.env.GOOGLE_MAPS_API_KEY;
  create(createIntermediateStopDto: CreateIntermediateStopDto) {
    return 'This action adds a new intermediateStop';
  }

  findAll() {
    return `This action returns all intermediateStops`;
  }

  findOne(id: number) {
    return `This action returns a #${id} intermediateStop`;
  }

  update(id: number, updateIntermediateStopDto: UpdateIntermediateStopDto) {
    return `This action updates a #${id} intermediateStop`;
  }

  remove(id: number) {
    return `This action removes a #${id} intermediateStop`;
  }

  async obtenerCiudadesIntermedias(getRouteCitiesDto: GetRouteCitiesDto) {
    const directions = await this.obtenerRuta(getRouteCitiesDto.origen, getRouteCitiesDto.destino);

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
        continue
      }
      if (ciudad) {
        ciudades.push(ciudad);
        cache.set(key, ciudad);
      }
    }

    return [...new Set(ciudades)];
  }

  private async obtenerRuta(origen: string, destino: string) {
    const res = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origen}, Ecuador`,
        destination: `${destino}, Ecuador`,
        key: this.apiKey,
      },
    });

    return res.data;
  }

  private async reverseGeocoding(lat: number, lng: number) {
    const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        result_type: 'locality|administrative_area_level_2',
      },
    });

    const results = res.data.results;
    const lugar = results.find(r =>
      r.types.includes('locality') || r.types.includes('administrative_area_level_2')
    );

    return lugar?.address_components?.[0]?.long_name ?? null;
  }
}

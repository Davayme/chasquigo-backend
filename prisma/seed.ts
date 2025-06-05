import { PrismaClient, Province, Role, } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes (opcional, ten cuidado en producción)
  await prisma.intermediateStop.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.routeSheetDetail.deleteMany({});
  await prisma.routeSheetHeader.deleteMany({});
  await prisma.frequency.deleteMany({});
  await prisma.busSeat.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.cooperative.deleteMany({});
  await prisma.city.deleteMany({});

  // Crear provincias
  console.log('Creando provincias...');
  const provinces = Object.values(Province);
  
  // Crear ciudades principales
  console.log('Creando ciudades...');
  const city1 = await prisma.city.create({
    data: {
      name: 'Quito',
      province: Province.PICHINCHA,
    },
  });

  const city2 = await prisma.city.create({
    data: {
      name: 'Guayaquil',
      province: Province.GUAYAS,
    },
  });

  const city3 = await prisma.city.create({
    data: {
      name: 'Cuenca',
      province: Province.AZUAY,
    },
  });

  // Crear una cooperativa
  console.log('Creando cooperativa...');
  const cooperative = await prisma.cooperative.create({
    data: {
      name: 'Cooperativa de Transporte Ejemplo',
      address: 'Av. Principal 123',
      phone: '022222222',
      email: 'contacto@cooperativa.com',
      logo: 'logo.png',
    },
  });

  // Crear un usuario administrador
  console.log('Creando usuario administrador...');
  const hashedPassword = await hash('admin123', 10);
  await prisma.user.create({
    data: {
      idNumber: '1804822748',
      documentType: 'cedula',
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@example.com',
      password: hashedPassword,
      phone: '0999999999',
      role: Role.ADMIN,
      cooperative: {
        connect: { id: cooperative.id }
      },
      
    },
  });

  // Crear un bus
  console.log('Creando bus...');
  const bus = await prisma.bus.create({
    data: {
      licensePlate: 'ABC-1234',
      chassisBrand: 'Mercedes Benz',
      bodyworkBrand: 'Busscar',
      photo: 'bus1.jpg',
      capacity: 40,
      seatType: 'semi-cama',
      stoppageDays: 2,
      cooperativeId: cooperative.id,
    },
  });

  // Crear asientos del bus
  console.log('Creando asientos...');
  for (let i = 1; i <= bus.capacity; i++) {
    await prisma.busSeat.create({
      data: {
        number: i.toString(),
        type: i <= 10 ? 'VIP' : 'normal',
        location: i % 2 === 0 ? 'ventana' : 'pasillo',
        busId: bus.id,
      },
    });
  }

  // Crear una ruta
  console.log('Creando ruta...');
  const frequency = await prisma.frequency.create({
    data: {
      departureTime: new Date('2023-01-01T08:00:00'),
      status: 'activo',
      antResolution: 'RES-2023-001',
      cooperative: {
        connect: { id: cooperative.id }
      },
      originCity: {
        connect: { id: city1.id }
      },
      destinationCity: {
        connect: { id: city2.id }
      },
    },
  });

  // Crear paradas intermedias
  console.log('Creando paradas intermedias...');
  await prisma.intermediateStop.create({
    data: {
      cityId: city3.id,
      order: 1,
      frequency: {
        connect: { id: frequency.id }
      }
    },
  });

  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

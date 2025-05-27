import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpExceptionFilter } from './filters/http-error-filter';

@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [HttpExceptionFilter],
    exports: [PrismaModule, HttpExceptionFilter],
})
export class CommonModule {}

import { Global, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpExceptionFilter } from './filters/http-error-filter';
@Global()
@Module({
    imports: [PrismaModule],
    controllers: [],
    providers: [HttpExceptionFilter],
    exports: [PrismaModule, HttpExceptionFilter],
})
export class CommonModule {}

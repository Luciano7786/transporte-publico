import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenTokensPush, EnviadorPush } from '../common/notifications/ports.js';
import { DispositivoPushEntidad } from './device-token.entity.js';
import { AlmacenTokensPorHacer } from './todo-token-store.js';
import { EnviadorPorHacer } from './todo-sender.js';

/**
 * Dónde se enchufan las dos piezas de las notificaciones (AGENTS §19).
 */
@Module({
  imports: [TypeOrmModule.forFeature([DispositivoPushEntidad])],
  providers: [
    { provide: AlmacenTokensPush, useClass: AlmacenTokensPorHacer },
    { provide: EnviadorPush, useClass: EnviadorPorHacer },
  ],
  exports: [AlmacenTokensPush, EnviadorPush],
})
export class NotificacionesAlumnosModulo {}

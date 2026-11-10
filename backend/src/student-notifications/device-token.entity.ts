import { Entity, Index, PrimaryColumn } from 'typeorm';
import { ColumnaEnum, ColumnaReferencia } from '../common/db/columns.js';
import type { Plataforma } from '../common/notifications/ports.js';

@Entity('dispositivos_push')
export class DispositivoPushEntidad {
  @PrimaryColumn({ type: 'varchar', length: 200 })
  tokenExpo: string;

  @Index()
  @ColumnaReferencia()
  usuarioId: string;

  @ColumnaEnum()
  plataforma: Plataforma;
}


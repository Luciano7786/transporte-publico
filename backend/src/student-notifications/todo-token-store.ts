import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ExclusionPorClave } from '../common/db/exclusion.js';
import { esViolacionDeUnicidad } from '../common/db/uniqueness.js';
import { AlmacenTokensPush, type Plataforma } from '../common/notifications/ports.js';
import { DispositivoPushEntidad } from './device-token.entity.js';

/**
 * PARTE 1 DE LOS ALUMNOS: guardar los tokens de Expo de cada usuario.
 */
@Injectable()
export class AlmacenTokensPorHacer extends AlmacenTokensPush {
  private readonly cerrojo = new ExclusionPorClave();

  constructor(
    @InjectRepository(DispositivoPushEntidad)
    private readonly repositorio: Repository<DispositivoPushEntidad>,
  ) {
    super();
  }

  async guardar(usuarioId: string, tokenExpo: string, plataforma: Plataforma): Promise<void> {
    await this.cerrojo.ejecutar(tokenExpo, async () => {
      const existente = await this.repositorio.findOneBy({ tokenExpo });
      if (existente) {
        if (existente.usuarioId !== usuarioId || existente.plataforma !== plataforma) {
          await this.repositorio.update({ tokenExpo }, { usuarioId, plataforma });
        }
        return;
      }

      try {
        await this.repositorio.insert({
          tokenExpo,
          usuarioId,
          plataforma,
        });
      } catch (error) {
        if (!esViolacionDeUnicidad(error)) throw error;
        await this.repositorio.update({ tokenExpo }, { usuarioId, plataforma });
      }
    });
  }

  async borrar(tokenExpo: string): Promise<void> {
    await this.repositorio.delete({ tokenExpo });
  }

  async tokensDe(usuarioIds: string[]): Promise<string[]> {
    if (usuarioIds.length === 0) return [];
    const unicos = [...new Set(usuarioIds)];
    const filas = await this.repositorio.find({
      where: { usuarioId: In(unicos) },
    });
    // Afinamos coincidencia exacta de mayúsculas/minúsculas de usuarioId
    return filas
      .filter((f) => unicos.includes(f.usuarioId))
      .map((f) => f.tokenExpo);
  }

  async descartar(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repositorio.delete({ tokenExpo: In([...new Set(tokens)]) });
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURACION, type Configuracion } from '../config/environment.js';
import { EnviadorPush, type MensajePush } from '../common/notifications/ports.js';

interface ItemExpoPush {
  to: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

interface TicketExpo {
  status?: string;
  details?: {
    error?: string;
  };
}

const LIMITE_POR_TANDA = 100;

/**
 * PARTE 2 DE LOS ALUMNOS: mandar las push a Expo.
 */
@Injectable()
export class EnviadorPorHacer extends EnviadorPush {
  constructor(@Inject(CONFIGURACION) private readonly config: Configuracion) {
    super();
  }

  async enviar(mensajes: MensajePush[]): Promise<{ tokensInvalidos: string[] }> {
    const items: ItemExpoPush[] = [];
    for (const msg of mensajes) {
      for (const token of msg.tokens) {
        items.push({
          to: token,
          title: msg.titulo,
          body: msg.cuerpo,
          data: msg.datos,
        });
      }
    }

    if (items.length === 0) {
      return { tokensInvalidos: [] };
    }

    const tokensInvalidos: string[] = [];

    for (let i = 0; i < items.length; i += LIMITE_POR_TANDA) {
      const tanda = items.slice(i, i + LIMITE_POR_TANDA);
      const respuesta = await fetch(this.config.expoPushUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tanda),
      });

      if (!respuesta.ok) {
        throw new Error(`Expo respondió con estado HTTP ${respuesta.status}`);
      }

      const cuerpo = (await respuesta.json()) as { data?: TicketExpo[] };
      if (!cuerpo || !Array.isArray(cuerpo.data)) {
        throw new Error('Respuesta de Expo con formato inválido');
      }

      cuerpo.data.forEach((ticket, idx) => {
        if (
          ticket?.status === 'error' &&
          ticket.details?.error === 'DeviceNotRegistered' &&
          tanda[idx]
        ) {
          tokensInvalidos.push(tanda[idx].to);
        }
      });
    }

    return { tokensInvalidos };
  }
}

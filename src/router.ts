/**
 * Navigazione basata sull'hash con nomi semplici (#catalogo, #scenario-U-01, #fondamenti-ellisse):
 * funziona sia in locale sia quando l'app è pubblicata come pagina statica.
 */
import { useSyncExternalStore } from 'react';

export type Route =
  | { page: 'catalogo' }
  | { page: 'scenario'; id: string }
  | { page: 'fondamenti'; anchor?: string }
  | { page: 'ammaloramenti' }
  | { page: 'metodo' };

export function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h.startsWith('scenario-')) return { page: 'scenario', id: h.slice('scenario-'.length) };
  if (h.startsWith('fondamenti')) {
    const anchor = h.slice('fondamenti'.length).replace(/^-/, '');
    return { page: 'fondamenti', anchor: anchor || undefined };
  }
  if (h === 'ammaloramenti') return { page: 'ammaloramenti' };
  if (h === 'metodo') return { page: 'metodo' };
  return { page: 'catalogo' };
}

export const href = {
  catalogo: '#catalogo',
  scenario: (id: string) => `#scenario-${id}`,
  fondamenti: (anchor?: string) => (anchor ? `#fondamenti-${anchor}` : '#fondamenti'),
  ammaloramenti: '#ammaloramenti',
  metodo: '#metodo',
};

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parse(hash);
}

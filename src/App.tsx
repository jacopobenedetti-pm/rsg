import { useEffect, useRef, useState } from 'react';
import { useRoute, href } from './router';
import { Catalogo } from './pages/Catalogo';
import { ScenarioPage } from './pages/ScenarioPage';
import { Fondamenti } from './pages/Fondamenti';
import { Ammaloramenti } from './pages/Ammaloramenti';
import { Metodo } from './pages/Metodo';

type Theme = 'system' | 'light' | 'dark';

function readTheme(): Theme {
  try {
    const t = localStorage.getItem('tema');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 L30 28 H2 Z" fill="#f2b632" stroke="#1a1400" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 24 C13 22 14 15 21 13" fill="none" stroke="#1a1400" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="21.5" cy="12.5" r="2" fill="#1a1400" />
    </svg>
  );
}

export function App() {
  const route = useRoute();
  const [theme, setTheme] = useState<Theme>(readTheme);

  // in modalità "sistema" non si tocca l'attributo: l'eventuale scelta dell'ospite (pagina pubblicata) resta valida
  const touched = useRef(false);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      if (touched.current) root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
      touched.current = true;
    }
    try {
      localStorage.setItem('tema', theme);
    } catch {
      /* preferenza non salvata */
    }
  }, [theme]);

  useEffect(() => {
    if (route.page !== 'fondamenti' || !route.anchor) window.scrollTo(0, 0);
  }, [route.page, route.page === 'scenario' ? route.id : '']);

  const nextTheme: Record<Theme, Theme> = { system: 'dark', dark: 'light', light: 'system' };
  const themeLabel: Record<Theme, string> = { system: 'Tema: sistema', dark: 'Tema: scuro', light: 'Tema: chiaro' };
  const current = route.page;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href={href.catalogo}>
            <BrandMark />
            Atlante pericoli moto
          </a>
          <nav className="nav" aria-label="Sezioni">
            <a href={href.catalogo} aria-current={current === 'catalogo' || current === 'scenario' ? 'page' : undefined}>
              Scenari
            </a>
            <a href={href.fondamenti()} aria-current={current === 'fondamenti' ? 'page' : undefined}>
              Fisica della moto
            </a>
            <a href={href.ammaloramenti} aria-current={current === 'ammaloramenti' ? 'page' : undefined}>
              Insidie dell’asfalto
            </a>
            <a href={href.metodo} aria-current={current === 'metodo' ? 'page' : undefined}>
              Metodo
            </a>
          </nav>
          <button type="button" className="theme-toggle" onClick={() => setTheme(nextTheme[theme])}>
            {themeLabel[theme]}
          </button>
        </div>
      </header>
      <main>
        {route.page === 'catalogo' && <Catalogo />}
        {route.page === 'scenario' && <ScenarioPage key={route.id} id={route.id} />}
        {route.page === 'fondamenti' && <Fondamenti anchor={route.anchor} />}
        {route.page === 'ammaloramenti' && <Ammaloramenti />}
        {route.page === 'metodo' && <Metodo />}
      </main>
    </>
  );
}

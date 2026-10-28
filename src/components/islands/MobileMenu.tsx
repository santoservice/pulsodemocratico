import { useEffect, useId, useRef, useState } from 'react';
import { ruta } from '../../lib/rutas';

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface Props {
  items: NavLink[];
  currentPath: string;
}

const clean = (p: string) => (p.length > 1 ? p.replace(/\/$/, '') : p);

function isCurrent(pathname: string, href: string): boolean {
  return clean(pathname) === clean(href);
}

function isActive(pathname: string, href: string): boolean {
  const path = clean(pathname);
  const target = clean(href);
  const inicio = clean(ruta('/'));
  if (target === inicio) return path === inicio;
  return path === target || path.startsWith(`${target}/`);
}

/**
 * Menú hamburguesa para móvil (< 768px). En escritorio se usa el nav CSS del Header.
 * Ocupa el alto de la pantalla bajo el header, con letra grande; la sección actual va en
 * crema. «Resultados» tiene un botón aparte para mostrar u ocultar sus temas.
 */
export default function MobileMenu({ items, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const subId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Los temas se ven abiertos de entrada si ya estamos en Resultados.
  const [subOpen, setSubOpen] = useState(() =>
    items.some((i) => i.children && isActive(currentPath, i.href)),
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    // Sin scroll de la página detrás del menú.
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      root.style.overflow = prev;
    };
  }, [open]);

  // La cabecera se entera de que el menú está abierto: pinta el logo en claro y quita el velo.
  useEffect(() => {
    buttonRef.current?.closest('[data-header]')?.toggleAttribute('data-menu-open', open);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-(--glass-fill) text-ink transition-colors group-data-[menu-open]/header:border-white/20 group-data-[menu-open]/header:text-[#F3F5FA]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Velo azul translúcido de la maqueta, a pantalla completa (cubre también la cabecera).
          Los puntos entran en cascada al abrir. */}
      <nav
        id={panelId}
        aria-label="Principal (móvil)"
        className={`fixed inset-0 z-0 overflow-y-auto bg-[rgb(0_16_46/0.62)] px-6 pt-24 pb-8 backdrop-blur-[22px] backdrop-saturate-[1.3] transition-[opacity,visibility] duration-300 ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
      >
        <ul className="container-page flex flex-col">
          {items.map((item, i) => {
            const active = isActive(currentPath, item.href);
            return (
              <li
                key={item.href}
                className={`border-b border-white/15 transition-[opacity,transform] duration-500 ease-out last:border-b-0 ${open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
                style={{ transitionDelay: open ? `${120 + i * 80}ms` : '0ms' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <a
                    href={item.href}
                    aria-current={isCurrent(currentPath, item.href) ? 'page' : undefined}
                    className={`block flex-1 py-4 font-display text-3xl leading-tight font-bold ${active ? 'text-[#F7EFD9]' : 'text-[#F3F5FA]'}`}
                  >
                    {item.label}
                  </a>
                  {item.children && (
                    <button
                      type="button"
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F3F5FA]"
                      aria-expanded={subOpen}
                      aria-controls={subId}
                      onClick={() => setSubOpen((v) => !v)}
                    >
                      <span className="sr-only">Mostrar temas de {item.label}</span>
                      <svg
                        aria-hidden="true"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${subOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </div>
                {item.children && (
                  <ul id={subId} hidden={!subOpen} className="pb-3 pl-2">
                    {item.children.map((child) => {
                      const childActive = isCurrent(currentPath, child.href);
                      return (
                        <li key={child.href}>
                          <a
                            href={child.href}
                            aria-current={childActive ? 'page' : undefined}
                            // Los temas son /resultados#<slug>: si ya estamos ahí no hay
                            // navegación, así que el menú se cierra a mano.
                            onClick={() => setOpen(false)}
                            className={`block py-2.5 text-lg ${childActive ? 'font-semibold text-[#F7EFD9]' : 'text-[#D9E1EF]'}`}
                          >
                            {child.label}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

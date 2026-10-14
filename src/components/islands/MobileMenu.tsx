import { useEffect, useId, useRef, useState } from 'react';

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
  if (target === '/') return path === '/';
  return path === target || path.startsWith(`${target}/`);
}

/** Menú hamburguesa para móvil (< 768px). En escritorio se usa el nav CSS del Header. */
export default function MobileMenu({ items, currentPath }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded border border-border text-ink"
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

      <nav
        id={panelId}
        aria-label="Principal (móvil)"
        hidden={!open}
        className="absolute inset-x-0 top-full z-40 border-b border-border bg-surface shadow-md"
      >
        <ul className="container-page flex flex-col py-2">
          {items.map((item) => {
            const active = isActive(currentPath, item.href);
            return (
              <li key={item.href} className="border-b border-surface-sunken last:border-b-0">
                <a
                  href={item.href}
                  aria-current={isCurrent(currentPath, item.href) ? 'page' : undefined}
                  className={`block py-3 text-base ${active ? 'font-semibold underline underline-offset-4' : ''}`}
                >
                  {item.label === 'Resultados' ? 'Resultados: Principales hallazgos' : item.label}
                </a>
                {item.children && (
                  <ul className="mb-2 ml-4 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const childActive = isCurrent(currentPath, child.href);
                      return (
                        <li key={child.href}>
                          <a
                            href={child.href}
                            aria-current={childActive ? 'page' : undefined}
                            className={`block py-2 text-sm text-ink-muted ${childActive ? 'font-semibold text-ink' : ''}`}
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

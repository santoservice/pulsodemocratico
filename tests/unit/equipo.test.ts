import { describe, expect, it } from 'vitest';
import { equipo, iniciales, orcidId, partesCorreo } from '../../src/data/equipo';

describe('equipo de trabajo', () => {
  it('tiene 8 integrantes en el orden del cliente', () => {
    expect(equipo.map((p) => p.nombre)).toEqual([
      'Hernando Rojas Hernández',
      'Óscar Iván Londoño Pardo',
      'Ana María Córdoba Hernández',
      'Marcela Durán Camero',
      'María Paula Arbeláez Linares',
      'Juan Nicolás Garzón Acosta',
      'Miguel Uribe Laverde',
      'Jesús David Cifuentes Yarce',
    ]);
  });

  it('slugs únicos, ORCID como URL válida y correos válidos', () => {
    expect(new Set(equipo.map((p) => p.slug)).size).toBe(equipo.length);
    for (const p of equipo) {
      expect(p.orcid).toMatch(/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/);
      expect(p.correos.length).toBeGreaterThan(0);
      for (const c of p.correos) expect(c).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]+$/);
      expect(p.perfil).toBe(p.perfil.trim());
      expect(p.perfil).not.toContain('Universidad se ');
    }
  });

  it('María Paula Arbeláez tiene sus dos correos', () => {
    const p = equipo.find((x) => x.slug === 'maria-paula-arbelaez-linares');
    expect(p?.correos).toEqual(['maria.arbelaez4@unisabana.edu.co', 'marbelae@ucm.es']);
  });

  it('todas las personas tienen foto en src/assets/equipo', () => {
    for (const p of equipo) expect(p.foto, p.slug).toBeTruthy();
  });
});

describe('helpers del equipo', () => {
  it('iniciales', () => {
    expect(iniciales('Miguel Uribe Laverde')).toBe('MU');
    expect(iniciales('Óscar Iván Londoño Pardo')).toBe('ÓI');
  });

  it('orcidId', () => {
    expect(orcidId('https://orcid.org/0000-0002-1512-604X')).toBe('0000-0002-1512-604X');
  });

  it('partesCorreo', () => {
    expect(partesCorreo('hrojas@wisc.edu')).toEqual({ usuario: 'hrojas', dominio: 'wisc.edu' });
  });
});

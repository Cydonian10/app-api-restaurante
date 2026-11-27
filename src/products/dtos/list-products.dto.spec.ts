import { describe, expect, it } from 'vitest';
import { listAdminProductsSchema } from './list-products.dto.js';

describe('listAdminProductsSchema', () => {
  it('normaliza el nombre y conserva los parámetros paginados', () => {
    expect(
      listAdminProductsSchema.parse({
        nombre: '  Lomo  ',
        page: '2',
        limit: '5',
        tipo: 'PLATO_FONDO',
      }),
    ).toEqual({ nombre: 'Lomo', page: 2, limit: 5, tipo: 'PLATO_FONDO' });
  });
});

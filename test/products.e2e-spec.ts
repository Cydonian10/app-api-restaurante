import { TokenService } from '@nestjs/authentication';
import {
  StandardSchemaValidationPipe,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ExternalIdentity } from '../src/auth/entities/external-identity.entity.js';
import { OidcFlow } from '../src/auth/entities/oidc-flow.entity.js';
import { User } from '../src/auth/entities/user.entity.js';
import { getDatabaseConfig } from '../src/config/database.config.js';
import { Product } from '../src/products/entities/product.entity.js';
import { IMAGE_STORAGE } from '../src/products/storage/image-storage.js';
import { LocalImageStorage } from '../src/products/storage/local-image.storage.js';
import { Person } from '../src/users/entities/person.entity.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';

describe('productos HTTP', () => {
  let app: INestApplication<App>;
  let db: DataSource;
  let directory: string;
  let adminToken: string;
  let clientToken: string;
  const adminId = randomUUID();
  const clientId = randomUUID();
  const productIds: string[] = [];
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'products-e2e-'));
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDataSourceToken())
      .useFactory({
        factory: () =>
          new DataSource({
            type: 'postgres',
            ...getDatabaseConfig(),
            entities: [User, Person, ExternalIdentity, OidcFlow, Product],
          }).initialize(),
      })
      .overrideProvider(IMAGE_STORAGE)
      .useValue(
        new LocalImageStorage(directory, 'http://localhost/uploads/products'),
      )
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    db = app.get(DataSource);
    await db.getRepository(User).insert([
      {
        id: adminId,
        email: `${adminId}@example.com`,
        role: UserRole.ADMIN,
        passwordHash: 'unused',
      },
      {
        id: clientId,
        email: `${clientId}@example.com`,
        role: UserRole.CLIENTE,
        passwordHash: 'unused',
      },
    ]);
    const tokens = app.get(TokenService);
    adminToken = (await tokens.issue(adminId)).accessToken;
    clientToken = (await tokens.issue(clientId)).accessToken;
  });

  afterAll(async () => {
    try {
      if (db) {
        if (productIds.length)
          await db.getRepository(Product).delete(productIds);
        await db.getRepository(User).delete([adminId, clientId]);
      }
    } finally {
      await app?.close();
      if (directory) await rm(directory, { recursive: true, force: true });
    }
  });

  it('protege creación, listado administrativo y cambio de disponibilidad', async () => {
    await request(app.getHttpServer()).post('/api/v1/products').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/products/admin')
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${randomUUID()}/disponibilidad`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ disponible: false })
      .expect(403);
  });

  it('protege la consulta administrativa por ID y valida su identificador', async () => {
    const id = randomUUID();
    await request(app.getHttpServer())
      .get(`/api/v1/products/admin/${id}`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/products/admin/${id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/products/admin/no-es-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    await request(app.getHttpServer())
      .get(`/api/v1/products/admin/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('busca por nombre sin distinguir mayúsculas antes de paginar y obtiene productos no disponibles por ID', async () => {
    const prefix = `Busqueda-${adminId}`;
    const ids: string[] = [];
    for (const nombre of [
      `${prefix} Lomo`,
      `${prefix} lomo especial`,
      `${prefix} Causa`,
    ]) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('nombre', nombre)
        .field('precio', '10.50')
        .field('tipo', 'PLATO_FONDO')
        .expect(201);
      const id = (response.body as { id: string }).id;
      ids.push(id);
      productIds.push(id);
    }
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${ids[0]}/disponibilidad`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ disponible: false })
      .expect(200);
    const pages: string[] = [];
    for (const page of [1, 2]) {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          nombre: `${prefix} LOMO`,
          tipo: 'PLATO_FONDO',
          page,
          limit: 1,
        })
        .expect(200);
      const body = response.body as {
        total: number;
        totalPages: number;
        items: { id: string }[];
      };
      expect(body).toMatchObject({ total: 2, totalPages: 2 });
      expect(body.items).toHaveLength(1);
      pages.push(body.items[0].id);
    }
    expect(pages.sort()).toEqual(ids.slice(0, 2).sort());
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/products/admin/${ids[0]}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(detail.body).toMatchObject({
      id: ids[0],
      nombre: `${prefix} Lomo`,
      disponible: false,
      precio: '10.50',
      principal: true,
    });
    expect(detail.body).not.toHaveProperty('deletedAt');
    expect(detail.body).not.toHaveProperty('imageKey');
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${ids[0]}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/api/v1/products/admin/${ids[0]}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
    const afterDelete = await request(app.getHttpServer())
      .get('/api/v1/products/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ nombre: `${prefix} LOMO`, tipo: 'PLATO_FONDO' })
      .expect(200);
    expect(afterDelete.body).toMatchObject({
      total: 1,
      items: [{ id: ids[1] }],
    });
    const noMatch = await request(app.getHttpServer())
      .get('/api/v1/products/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ nombre: `${prefix} LOMO`, tipo: 'BEBIDA' })
      .expect(200);
    expect(noMatch.body).toMatchObject({ total: 0, items: [] });
  });

  it('crea, lista, sube imagen y cambia disponibilidad', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', `Producto ${adminId}`)
      .field('precio', '12.50')
      .field('tipo', 'PLATO_FONDO')
      .expect(201);
    const product = created.body as {
      id: string;
      principal: boolean;
      disponible: boolean;
      precio: string;
    };
    productIds.push(product.id);
    expect(product).toMatchObject({
      principal: true,
      disponible: true,
      precio: '12.50',
    });
    const publicList = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ tipo: 'PLATO_FONDO', limit: 100 })
      .expect(200);
    expect(
      (publicList.body as { items: { id: string }[] }).items.some(
        (item) => item.id === product.id,
      ),
    ).toBe(true);
    const image = await request(app.getHttpServer())
      .post(`/api/v1/products/${product.id}/imagen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('imagen', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(201);
    const imageUrl = (image.body as { imageUrl: string }).imageUrl;
    expect(
      await readFile(join(directory, imageUrl.split('/').at(-1)!)),
    ).toEqual(png);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${product.id}/disponibilidad`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ disponible: false })
      .expect(200, { id: product.id, disponible: false });
    const publicAfter = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ tipo: 'PLATO_FONDO', limit: 100 })
      .expect(200);
    expect(
      (publicAfter.body as { items: { id: string }[] }).items.some(
        (item) => item.id === product.id,
      ),
    ).toBe(false);
    const adminList = await request(app.getHttpServer())
      .get('/api/v1/products/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ tipo: 'PLATO_FONDO', limit: 100 })
      .expect(200);
    expect(
      (adminList.body as { items: { id: string; disponible: boolean }[] })
        .items,
    ).toContainEqual(
      expect.objectContaining({ id: product.id, disponible: false }),
    );
  });

  it('rechaza entradas inválidas y productos inexistentes', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'x')
      .field('precio', '1.234')
      .field('tipo', 'BEBIDA')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ tipo: 'INVALIDO' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${randomUUID()}/disponibilidad`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ disponible: true })
      .expect(404);
  });

  it('protege, edita y da de baja sin borrar el registro', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Original')
      .field('precio', '1')
      .field('tipo', 'BEBIDA')
      .expect(201);
    const id = (created.body as { id: string }).id;
    productIds.push(id);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Editado')
      .field('descripcion', 'Detalle')
      .field('precio', '4.50')
      .field('tipo', 'POSTRE')
      .attach('imagen', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(200);
    expect(await db.getRepository(Product).findOneBy({ id })).toMatchObject({
      nombre: 'Editado',
      descripcion: 'Detalle',
      precio: '4.50',
      tipo: 'POSTRE',
      imageUrl: expect.any(String),
    });
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (await db.getRepository(Product).findOneBy({ id }))?.deletedAt,
    ).toBeInstanceOf(Date);
    for (const path of ['/api/v1/products', '/api/v1/products/admin']) {
      const response = await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ tipo: 'POSTRE', limit: 100 })
        .expect(200);
      expect(
        (response.body as { items: { id: string }[] }).items.some(
          (item) => item.id === id,
        ),
      ).toBe(false);
    }
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'x')
      .field('precio', '1')
      .field('tipo', 'BEBIDA')
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/api/v1/products/${id}/disponibilidad`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ disponible: true })
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/products/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('crea con imagen y rechaza archivos inválidos', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', `Bebida ${adminId}`)
      .field('precio', '0')
      .field('tipo', 'BEBIDA')
      .attach('imagen', png, { filename: 'foto.png', contentType: 'image/png' })
      .expect(201);
    const product = created.body as {
      id: string;
      imageUrl: string;
      principal: boolean;
    };
    productIds.push(product.id);
    expect(product.principal).toBe(false);
    expect(
      await readFile(join(directory, product.imageUrl.split('/').at(-1)!)),
    ).toEqual(png);
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('nombre', 'Imagen inválida')
      .field('precio', '1')
      .field('tipo', 'BEBIDA')
      .attach('imagen', Buffer.from('no es imagen'), {
        filename: 'foto.png',
        contentType: 'image/png',
      })
      .expect(400);
  });
});

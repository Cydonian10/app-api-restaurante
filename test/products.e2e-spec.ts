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

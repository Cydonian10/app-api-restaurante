import { TokenService } from '@nestjs/authentication';
import {
  StandardSchemaValidationPipe,
  VersioningType,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/auth/entities/user.entity.js';
import { ExternalIdentity } from '../src/auth/entities/external-identity.entity.js';
import { OidcFlow } from '../src/auth/entities/oidc-flow.entity.js';
import { Person } from '../src/users/entities/person.entity.js';
import { UserRole } from '../src/users/enums/user-role.enum.js';
import { Product } from '../src/products/entities/product.entity.js';
import { ProductType } from '../src/products/enums/product-type.enum.js';
import { Zone } from '../src/dining/entities/zone.entity.js';
import { DiningTable } from '../src/dining/entities/dining-table.entity.js';
import { TableSession } from '../src/dining/entities/table-session.entity.js';
import { Order } from '../src/orders/entities/order.entity.js';
import { OrderItem } from '../src/orders/entities/order-item.entity.js';
import { MenuSelection } from '../src/orders/entities/menu-selection.entity.js';
import { Payment } from '../src/orders/entities/payment.entity.js';
import { OrderItemStatus } from '../src/orders/enums/order-item-status.enum.js';

describe('órdenes HTTP en base temporal exclusiva', () => {
  let app: INestApplication;
  let db: DataSource;
  let admin: DataSource;
  let createdDatabase = false;
  const database = `orders_e2e_${randomUUID().replaceAll('-', '')}`;
  const connection = {
    type: 'postgres' as const,
    host: process.env.TEST_DB_HOST ?? 'localhost',
    port: Number(process.env.TEST_DB_PORT ?? 5432),
    username: process.env.TEST_DB_USERNAME ?? 'restaurante',
    password: process.env.TEST_DB_PASSWORD ?? 'restaurante',
  };
  const tokens = new Map<UserRole, string>();
  let session: TableSession;
  let menu: Product;
  let extra: Product;
  let drink: Product;
  const base = '/api/v1';
  const auth = (role = UserRole.ADMIN) => `Bearer ${tokens.get(role)}`;
  const payload = () => ({ items: [{ productId: menu.id, quantity: 1 }] });

  beforeAll(async () => {
    admin = await new DataSource({
      ...connection,
      database: 'postgres',
    }).initialize();
    await admin.query(`CREATE DATABASE "${database}"`);
    createdDatabase = true;
    db = await new DataSource({
      ...connection,
      database,
      synchronize: true,
      entities: [
        User,
        ExternalIdentity,
        OidcFlow,
        Person,
        Product,
        Zone,
        DiningTable,
        TableSession,
        Order,
        OrderItem,
        MenuSelection,
        Payment,
      ],
    }).initialize();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getDataSourceToken())
      .useValue(db)
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    for (const role of Object.values(UserRole)) {
      const user = await db.getRepository(User).save({
        id: randomUUID(),
        email: `${randomUUID()}@example.com`,
        role,
        passwordHash: 'unused',
      });
      tokens.set(
        role,
        (await app.get(TokenService).issue(user.id)).accessToken,
      );
    }
  }, 30000);

  beforeEach(async () => {
    const zone = await db.getRepository(Zone).save({ name: randomUUID() });
    const table = await db.getRepository(DiningTable).save({
      zoneId: zone.id,
      number: 1,
      capacity: 4,
      positionX: 0,
      positionY: 0,
    });
    session = await db
      .getRepository(TableSession)
      .save({ tableId: table.id, partySize: 2 });
    const products = db.getRepository(Product);
    menu = await products.save({
      nombre: 'Menú original',
      precio: '12.50',
      tipo: ProductType.MENU,
    });
    extra = await products.save({
      nombre: 'Extra',
      precio: '4.00',
      tipo: ProductType.EXTRA,
    });
    drink = await products.save({
      nombre: 'Bebida menú',
      precio: '2.50',
      tipo: ProductType.BEBIDA_MENU,
    });
  });

  afterEach(async () => {
    if (db?.isInitialized)
      await db.query(
        'TRUNCATE menu_selections, order_items, orders, payments, table_sessions, dining_tables, zones, products CASCADE',
      );
  });
  afterAll(async () => {
    await app?.close();
    if (db?.isInitialized) await db.destroy();
    if (admin?.isInitialized) {
      if (createdDatabase)
        await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
      await admin.destroy();
    }
  });

  it('publica los cuatro endpoints y contratos de órdenes en OpenAPI', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const nested = document.paths[`${base}/table-sessions/{id}/orders`];
    const order = document.paths[`${base}/orders/{id}`];
    const items = document.paths[`${base}/orders/{id}/items`];
    for (const operation of [
      nested?.get,
      nested?.post,
      order?.get,
      items?.post,
    ]) {
      expect(operation).toBeDefined();
      expect(operation?.security).toContainEqual({ bearer: [] });
      expect(operation?.responses).toHaveProperty('401');
      expect(operation?.responses).toHaveProperty('403');
      expect(operation?.responses).toHaveProperty('404');
    }
    expect(nested?.post?.responses).toHaveProperty('409');
    expect(items?.post?.responses).toHaveProperty('409');
    expect(nested?.post?.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: {
            required: ['items'],
            properties: { items: { type: 'array', minItems: 1 } },
          },
        },
      },
    });
    expect(document.components?.schemas?.OrderResponseDto).toBeDefined();
  });

  it('crea varias órdenes, agrega unidades y conserva nombre/precio y selecciones en consultas', async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .send({
        items: [
          {
            productId: menu.id,
            quantity: 3,
            selections: [
              { extraProductId: extra.id },
              { drinkProductId: drink.id },
              { extraProductId: extra.id, drinkProductId: drink.id },
            ],
          },
        ],
      })
      .expect(201);
    const orderId = created.body.id;
    expect(created.body.items).toHaveLength(3);
    expect(await db.getRepository(OrderItem).countBy({ orderId })).toBe(3);
    expect(await db.getRepository(MenuSelection).count()).toBe(3);
    const second = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth(UserRole.MOZO))
      .send(payload())
      .expect(201);
    await db
      .getRepository(Product)
      .update(menu.id, { nombre: 'Menú nuevo', precio: '15.00' });
    await db.getRepository(OrderItem).update(created.body.items[0].id, {
      status: OrderItemStatus.DELIVERED,
      deliveredAt: new Date(),
    });
    await db
      .getRepository(OrderItem)
      .update(created.body.items[1].id, { status: OrderItemStatus.CANCELLED });
    await request(app.getHttpServer())
      .post(`${base}/orders/${orderId}/items`)
      .set('Authorization', auth(UserRole.ATENCION))
      .send(payload())
      .expect(201);
    const detail = await request(app.getHttpServer())
      .get(`${base}/orders/${orderId}`)
      .set('Authorization', auth())
      .expect(200);
    expect(detail.body.items).toHaveLength(4);
    expect(
      detail.body.items.filter(
        (item: { unitPrice: string }) => item.unitPrice === '12.50',
      ),
    ).toHaveLength(3);
    expect(detail.body.items).toContainEqual(
      expect.objectContaining({
        productName: 'Menú nuevo',
        unitPrice: '15.00',
        status: 'PENDING',
      }),
    );
    expect(detail.body.items).toContainEqual(
      expect.objectContaining({
        menuSelection: expect.objectContaining({
          extraProductId: extra.id,
          drinkProductId: null,
        }),
      }),
    );
    await db
      .getRepository(TableSession)
      .update(session.id, { closedAt: new Date() });
    const list = await request(app.getHttpServer())
      .get(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .expect(200);
    expect(list.body.map((order: { id: string }) => order.id).sort()).toEqual(
      [orderId, second.body.id].sort(),
    );
    await request(app.getHttpServer())
      .get(`${base}/orders/${orderId}`)
      .set('Authorization', auth())
      .expect(200);
  });

  it('revierte toda la creación y agregado ante productos y selecciones inválidos', async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .send(payload())
      .expect(201);
    for (const invalidLine of [
      { productId: randomUUID(), quantity: 1 },
      {
        productId: menu.id,
        quantity: 1,
        selections: [{ extraProductId: drink.id }],
      },
      {
        productId: menu.id,
        quantity: 1,
        selections: [{ drinkProductId: extra.id }],
      },
      {
        productId: extra.id,
        quantity: 1,
        selections: [{ extraProductId: extra.id }],
      },
    ]) {
      for (const path of [
        `table-sessions/${session.id}/orders`,
        `orders/${created.body.id}/items`,
      ]) {
        await request(app.getHttpServer())
          .post(`${base}/${path}`)
          .set('Authorization', auth())
          .send({ items: [...payload().items, invalidLine] })
          .expect(400);
        expect(await db.getRepository(Order).count()).toBe(1);
        expect(await db.getRepository(OrderItem).count()).toBe(1);
        expect(await db.getRepository(MenuSelection).count()).toBe(0);
      }
    }
    for (const change of [
      { disponible: false },
      { disponible: true, deletedAt: new Date() },
    ]) {
      await db.getRepository(Product).update(menu.id, change);
      await request(app.getHttpServer())
        .post(`${base}/orders/${created.body.id}/items`)
        .set('Authorization', auth())
        .send(payload())
        .expect(400);
      expect(await db.getRepository(OrderItem).count()).toBe(1);
    }
  });

  it('responde 404, 409 y 400 sin escrituras y permite listar una atención vacía', async () => {
    await request(app.getHttpServer())
      .get(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .expect(200, []);
    for (const path of [
      `orders/${randomUUID()}`,
      `table-sessions/${randomUUID()}/orders`,
    ])
      await request(app.getHttpServer())
        .get(`${base}/${path}`)
        .set('Authorization', auth())
        .expect(404);
    for (const path of [
      `orders/${randomUUID()}/items`,
      `table-sessions/${randomUUID()}/orders`,
    ])
      await request(app.getHttpServer())
        .post(`${base}/${path}`)
        .set('Authorization', auth())
        .send(payload())
        .expect(404);
    for (const body of [
      { items: [] },
      { items: [{ productId: menu.id, quantity: 0 }] },
      { items: [{ productId: menu.id, quantity: 1.2 }] },
      { items: [{ productId: menu.id, quantity: 1, selections: [{}, {}] }] },
    ])
      await request(app.getHttpServer())
        .post(`${base}/table-sessions/${session.id}/orders`)
        .set('Authorization', auth())
        .send(body)
        .expect(400);
    const created = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .send(payload())
      .expect(201);
    await db
      .getRepository(TableSession)
      .update(session.id, { closedAt: new Date() });
    for (const path of [
      `orders/${created.body.id}/items`,
      `table-sessions/${session.id}/orders`,
    ])
      await request(app.getHttpServer())
        .post(`${base}/${path}`)
        .set('Authorization', auth())
        .send(payload())
        .expect(409);
    expect(await db.getRepository(Order).count()).toBe(1);
    expect(await db.getRepository(OrderItem).count()).toBe(1);
  });

  it('autoriza exclusivamente ADMIN, ATENCION y MOZO en los cuatro endpoints', async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .send(payload())
      .expect(201);
    const operations = [
      ['get', `orders/${created.body.id}`],
      ['get', `table-sessions/${session.id}/orders`],
      ['post', `orders/${created.body.id}/items`],
      ['post', `table-sessions/${session.id}/orders`],
    ] as const;
    for (const [method, path] of operations) {
      await request(app.getHttpServer())
        [method](`${base}/${path}`)
        .send(payload())
        .expect(401);
      for (const role of [UserRole.COCINA, UserRole.CLIENTE])
        await request(app.getHttpServer())
          [method](`${base}/${path}`)
          .set('Authorization', auth(role))
          .send(payload())
          .expect(403);
      for (const role of [UserRole.ADMIN, UserRole.ATENCION, UserRole.MOZO])
        await request(app.getHttpServer())
          [method](`${base}/${path}`)
          .set('Authorization', auth(role))
          .send(payload())
          .expect(method === 'post' ? 201 : 200);
    }
  });

  it('espera un cierre concurrente y rechaza el agregado después del commit', async () => {
    const created = await request(app.getHttpServer())
      .post(`${base}/table-sessions/${session.id}/orders`)
      .set('Authorization', auth())
      .send(payload())
      .expect(201);
    const closer = db.createQueryRunner();
    await closer.connect();
    await closer.startTransaction();
    try {
      await closer.manager.getRepository(TableSession).findOne({
        where: { id: session.id },
        lock: { mode: 'pessimistic_write' },
      });
      await closer.manager.update(TableSession, session.id, {
        closedAt: new Date(),
      });
      const pending = request(app.getHttpServer())
        .post(`${base}/orders/${created.body.id}/items`)
        .set('Authorization', auth())
        .send(payload())
        .then((response) => response);
      // Observe the real PostgreSQL lock wait rather than relying on elapsed time.
      let waiting = false;
      for (let attempt = 0; attempt < 100 && !waiting; attempt++) {
        const rows = await db.query(
          "SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%table_sessions%'",
        );
        waiting = rows.length > 0;
        if (!waiting) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      await closer.commitTransaction();
      expect((await pending).status).toBe(409);
      expect(await db.getRepository(OrderItem).count()).toBe(1);
    } finally {
      if (closer.isTransactionActive) await closer.rollbackTransaction();
      await closer.release();
    }
  });
});

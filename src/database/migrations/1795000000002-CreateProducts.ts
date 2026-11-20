import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1795000000002 implements MigrationInterface {
  name = 'CreateProducts1795000000002';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "product_type_enum" AS ENUM ('BEBIDA', 'EXTRA', 'PLATO_FONDO', 'POSTRE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying NOT NULL, "descripcion" text, "precio" numeric(12,2) NOT NULL, "tipo" "product_type_enum" NOT NULL, "disponible" boolean NOT NULL DEFAULT true, "image_url" text, "image_provider" character varying, "image_key" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_products" PRIMARY KEY ("id"))`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "product_type_enum"`);
  }
}

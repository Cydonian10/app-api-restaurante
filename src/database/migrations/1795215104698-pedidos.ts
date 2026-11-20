import { MigrationInterface, QueryRunner } from "typeorm";

export class Pedidos1795215104698 implements MigrationInterface {
    name = 'Pedidos1795215104698'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "table_session_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."order_item_status_enum" AS ENUM('PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "product_name" character varying NOT NULL, "unit_price" numeric(12,2) NOT NULL, "status" "public"."order_item_status_enum" NOT NULL, "delivered_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_order_items_delivered_at_status" CHECK (("status" = 'DELIVERED' AND "delivered_at" IS NOT NULL) OR ("status" <> 'DELIVERED' AND "delivered_at" IS NULL)), CONSTRAINT "chk_order_items_unit_price_nonnegative" CHECK ("unit_price" >= 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "menu_selections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_item_id" uuid NOT NULL, "extra_product_id" uuid, "drink_product_id" uuid, CONSTRAINT "REL_1d3f606edab6d2868f9515673d" UNIQUE ("order_item_id"), CONSTRAINT "PK_f42df5118c4338f72cfdefa11d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TYPE "public"."product_type_enum" ADD VALUE 'MENU'`);
        await queryRunner.query(`ALTER TYPE "public"."product_type_enum" ADD VALUE 'BEBIDA_MENU'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_a955620b97c0a9dfcf80acef786" FOREIGN KEY ("table_session_id") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_selections" ADD CONSTRAINT "FK_1d3f606edab6d2868f9515673d2" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_selections" ADD CONSTRAINT "FK_fde79a6bdaa443231f945eb3816" FOREIGN KEY ("extra_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "menu_selections" ADD CONSTRAINT "FK_7909fa3b578b955ee0468f8383d" FOREIGN KEY ("drink_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "menu_selections" DROP CONSTRAINT "FK_7909fa3b578b955ee0468f8383d"`);
        await queryRunner.query(`ALTER TABLE "menu_selections" DROP CONSTRAINT "FK_fde79a6bdaa443231f945eb3816"`);
        await queryRunner.query(`ALTER TABLE "menu_selections" DROP CONSTRAINT "FK_1d3f606edab6d2868f9515673d2"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`);
        await queryRunner.query(`ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_a955620b97c0a9dfcf80acef786"`);
        await queryRunner.query(`CREATE TYPE "public"."product_type_enum_old" AS ENUM('BEBIDA', 'EXTRA', 'PLATO_FONDO', 'POSTRE')`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "tipo" TYPE "public"."product_type_enum_old" USING "tipo"::"text"::"public"."product_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."product_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."product_type_enum_old" RENAME TO "product_type_enum"`);
        await queryRunner.query(`DROP TABLE "menu_selections"`);
        await queryRunner.query(`DROP TABLE "order_items"`);
        await queryRunner.query(`DROP TYPE "public"."order_item_status_enum"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}

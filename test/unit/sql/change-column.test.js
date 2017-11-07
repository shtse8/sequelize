'use strict';

const Support   = require(__dirname + '/../support'),
  DataTypes = require('../../../lib/data-types'),
  expectsql = Support.expectsql,
  sinon = require('sinon'),
  current   = Support.sequelize,
  Promise = current.Promise;


if (current.dialect.name !== 'sqlite') {
  describe(Support.getTestDialectTeaser('SQL'), () => {
    describe('changeColumn', () => {

      const Model = current.define('users', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        level_id: {
          type: DataTypes.INTEGER
        }
      }, { timestamps: false });

      before(function() {

        this.stub = sinon.stub(current, 'query', sql => {
          return Promise.resolve(sql);
        });
      });

      beforeEach(function() {
        this.stub.reset();
      });

      after(function() {
        this.stub.restore();
      });

      it('properly generate alter queries', () => {
        return current.getQueryInterface().changeColumn(Model.getTableName(), 'level_id', {
          type: DataTypes.FLOAT,
          allowNull: false
        }).then(sql => {
          expectsql(sql, {
            mssql: 'ALTER TABLE [users] ALTER COLUMN [level_id] FLOAT NOT NULL;',
            mysql: 'ALTER TABLE `users` CHANGE `level_id` `level_id` FLOAT NOT NULL;',
            oracle: 'BEGIN EXECUTE IMMEDIATE \'ALTER TABLE users MODIFY (level_id FLOAT NOT NULL)\'; EXCEPTION WHEN OTHERS THEN IF SQLCODE = -1442 OR SQLCODE = -1451 THEN EXECUTE IMMEDIATE \'ALTER TABLE users MODIFY (level_id FLOAT )\'; ELSE RAISE; END IF; END;',
            postgres: 'ALTER TABLE "users" ALTER COLUMN "level_id" SET NOT NULL;ALTER TABLE "users" ALTER COLUMN "level_id" DROP DEFAULT;ALTER TABLE "users" ALTER COLUMN "level_id" TYPE FLOAT;'
          });
        });
      });

      it('properly generate alter queries for foreign keys', () => {
        return current.getQueryInterface().changeColumn(Model.getTableName(), 'level_id', {
          type: DataTypes.INTEGER,
          references: {
            model: 'level',
            key:   'id'
          },
          onUpdate: 'cascade',
          onDelete: 'cascade'
        }).then(sql => {
          expectsql(sql, {
            mssql: 'ALTER TABLE [users] ADD CONSTRAINT [level_id_foreign_idx] FOREIGN KEY ([level_id]) REFERENCES [level] ([id]) ON DELETE CASCADE;',
            mysql: 'ALTER TABLE `users` ADD CONSTRAINT `users_level_id_foreign_idx` FOREIGN KEY (`level_id`) REFERENCES `level` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;',
            oracle: 'BEGIN EXECUTE IMMEDIATE \'ALTER TABLE users ADD CONSTRAINT level_id_foreign_idx FOREIGN KEY (level_id) REFERENCES "level" (id) ON DELETE CASCADE\'; EXCEPTION WHEN OTHERS THEN IF SQLCODE = -1442 OR SQLCODE = -1451 THEN EXECUTE IMMEDIATE \'ALTER TABLE users ADD CONSTRAINT level_id_foreign_idx FOREIGN KEY (level_id) REFERENCES "level" (id) ON DELETE CASCADE\'; ELSE RAISE; END IF; END;',
            postgres: 'ALTER TABLE "users"  ADD CONSTRAINT "level_id_foreign_idx" FOREIGN KEY ("level_id") REFERENCES "level" ("id") ON DELETE CASCADE ON UPDATE CASCADE;'
          });
        });
      });

    });
  });
}

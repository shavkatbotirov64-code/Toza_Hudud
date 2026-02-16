import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  // Try DATABASE_URL first (Railway/Neon style)
  const databaseUrl = configService.get('DATABASE_URL');
  
  if (databaseUrl) {
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Disabled - using manual migrations
      logging: false,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
  
  // Fallback to individual variables
  return {
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'password'),
    database: configService.get('DB_NAME', 'smart_trash_db'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Disabled - using manual migrations
    logging: false,
    ssl: false,
  };
};
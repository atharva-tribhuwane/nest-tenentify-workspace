import { DynamicModule, Module, Global, Provider, Type } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenentifyGuard } from './modules/auth/guards/tenentify.guard';
import { TenantContext } from './tenent/tenent-context.service'; // Adjust path if needed
import { STRATEGY_REGISTRY } from './constants';
import { IAuthStrategy } from './interfaces/auth.interface';

export interface TenentifyModuleOptions {
  /**
   * List of Strategy classes (e.g., [JwtStrategy, ApiKeyStrategy])
   */
  strategies: Type<IAuthStrategy>[];
  
  /**
   * If true, the TenentifyGuard will be registered as a global guard.
   * Default: false
   */
  isGlobalGuard?: boolean;
}

@Global()
@Module({})
export class NestTenentifyModule {
  /**
   * Register the module dynamically. 
   * This is the "Plug-and-Play" entry point for the consumer.
   */
  static register(options: TenentifyModuleOptions): DynamicModule {
    const strategyProviders: Provider[] = options.strategies;

    const providers: Provider[] = [
      ...strategyProviders,
      TenantContext,
      {
        provide: STRATEGY_REGISTRY,
        // Injects all strategy instances into a single array for the Guard
        useFactory: (...instances: IAuthStrategy[]) => instances,
        inject: options.strategies,
      },
    ];

    // Automatically bind the guard globally if the user requests it
    if (options.isGlobalGuard) {
      providers.push({
        provide: APP_GUARD,
        useClass: TenentifyGuard,
      });
    } else {
      // Still provide it so it can be used with @UseGuards(TenentifyGuard)
      providers.push(TenentifyGuard);
    }

    return {
      module: NestTenentifyModule,
      providers,
      exports: [TenantContext, STRATEGY_REGISTRY, TenentifyGuard],
    };
  }
}
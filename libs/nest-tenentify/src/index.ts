// 1. Core Module
export * from './nest-tenentify.module';

// 2. Multi-Tenant Context
// Note: Ensure the path matches where you moved the service (e.g., ./tenent/...)
export * from './tenent/tenent-context.service';

// 3. Decorators (The UX of your library)
export * from './decorators/auth.decorator';
export * from './decorators/current-actor.decorator';
export * from './decorators/policy.decorator';

// 4. Guards
export * from './modules/auth/guards/tenentify.guard';

// 5. Interfaces (For type-safety in the consumer app)
export * from './interfaces/auth.interface';
export * from './interfaces/policy.interface';

// 6. Constants (Metadata keys and Registry tokens)
export * from './constants';
import { Module } from '@nestjs/common';
import { NestTenentifyService } from './nest-tenentify.service';

@Module({
  providers: [NestTenentifyService],
  exports: [NestTenentifyService],
})
export class NestTenentifyModule {}

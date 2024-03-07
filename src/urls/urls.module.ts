import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UrlsController } from './urls.controller';
import { UrlsService } from './urls.service';
import { UrlSchema } from './schemas/url.schema';
import { AppConfigService } from 'src/config.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Url', schema: UrlSchema }])],
  controllers: [UrlsController],
  providers: [UrlsService, AppConfigService],
})
export class UrlsModule {}

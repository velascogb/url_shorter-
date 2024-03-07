import { Controller, Get, Post, Body, Redirect, Param } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { CreateUrlDto } from './dto/create-url.dto';

@Controller('')
export class UrlsController {
  constructor(private readonly urlsService: UrlsService) {}

  @Post()
  async createShortUrl(@Body() createUrlDto: CreateUrlDto) {
    const url = await this.urlsService.createShortUrl(createUrlDto.originalUrl);
    return { shortUrl: url };
  }

  @Get(':shortUrl')
  @Redirect()
  async redirectToOriginalUrl(@Param('shortUrl') shortUrl: string) {
    const originalUrl = await this.urlsService.redirectToOriginalUrl(shortUrl);
    return { url: originalUrl, statusCode: 302 };
  }

  @Get('top/urls')
  async getTopUrls() {
    const urls = await this.urlsService.getTopUrls();
    return urls;
  }
}

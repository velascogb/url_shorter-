import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Url } from './schemas/url.schema';
import axios from 'axios';
import { AppConfigService } from 'src/config.service';

@Injectable()
export class UrlsService {
  constructor(
    @InjectModel(Url.name) private urlModel: Model<Url>,
    private appConfigService: AppConfigService,
  ) {}

  async createShortUrl(originalUrl: string): Promise<string> {
    const existingUrl = await this.urlModel.findOne({ originalUrl }).exec();
    if (existingUrl) {
      throw new ConflictException(
        `This URL already exists: ${existingUrl.shortUrl}`,
      );
    }
    const title = await this.fetchPageTitle(originalUrl);
    const urlDoc = new this.urlModel({
      originalUrl,
      title,
      accessCount: 0,
      shortUrl: '',
    });

    await urlDoc.save();
    urlDoc.shortUrl = `${this.appConfigService.baseUrl}/${this.encode(urlDoc.id)}`;
    await urlDoc.save();

    return urlDoc.shortUrl;
  }

  private async fetchPageTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const match = response.data.match(/<title>(.*?)<\/title>/i);
      return match ? match[1] : 'No Title Found';
    } catch (error) {
      console.error('Error fetching page title:', error);
      return 'No Title Found';
    }
  }

  private encode(id: string): string {
    const base62 =
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let num = parseInt(id.slice(-6), 16);
    let encoded = '';
    while (num) {
      encoded = base62[num % 62] + encoded;
      num = Math.floor(num / 62);
    }
    return encoded;
  }

  async redirectToOriginalUrl(shortUrl: string): Promise<string> {
    const url = await this.urlModel.findOne({
      shortUrl: `${this.appConfigService.baseUrl}/${shortUrl}`,
    });
    if (!url) {
      throw new NotFoundException('URL not found');
    }
    url.accessCount += 1;
    await url.save();
    return url.originalUrl;
  }

  async getTopUrls(): Promise<Url[]> {
    return this.urlModel.find().sort({ accessCount: -1 }).limit(100).exec();
  }
}

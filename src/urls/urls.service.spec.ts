import { Test, TestingModule } from '@nestjs/testing';
import { UrlsService } from './urls.service';
import { getModelToken } from '@nestjs/mongoose';
import { Url } from './schemas/url.schema';
import { AppConfigService } from 'src/config.service';
import { ConflictException } from '@nestjs/common';

describe('UrlsService', () => {
  let service: UrlsService;
  let model: any;
  let appConfigService: AppConfigService;

  beforeEach(async () => {
    const appConfigServiceMock = {
      baseUrl: 'http://localhost:3000',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlsService,
        {
          provide: getModelToken(Url.name),
          useValue: {
            findOne: jest.fn().mockImplementation(() => ({
              exec: jest.fn().mockResolvedValue(null),
            })),
            sort: jest.fn().mockReturnThis(),
            find: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: AppConfigService,
          useValue: appConfigServiceMock,
        },
      ],
    }).compile();

    service = module.get<UrlsService>(UrlsService);
    model = module.get(getModelToken(Url.name));
    appConfigService = module.get<AppConfigService>(AppConfigService);
  });

  it('should throw a ConflictException if the URL already exists', async () => {
    model.findOne.mockImplementation(() => ({
      exec: jest.fn().mockResolvedValue({
        originalUrl: 'http://mediotiempo.com',
        shortUrl: 'http://localhost:3000/abc123',
      }),
    }));

    await expect(
      service.createShortUrl('http://mediotiempo.com'),
    ).rejects.toThrow(ConflictException);
  });

  it('should increase access count and return the original URL', async () => {
    const mockShortUrl = 'abc123';
    jest.spyOn(model, 'findOne').mockResolvedValueOnce({
      shortUrl: `${appConfigService.baseUrl}/${mockShortUrl}`,
      originalUrl: 'https://mediotiempo.com',
      accessCount: 0,
      save: jest.fn(),
    });

    const result = await service.redirectToOriginalUrl(mockShortUrl);

    expect(result).toEqual('https://mediotiempo.com');
    expect(model.findOne).toHaveBeenCalledWith({
      shortUrl: `${appConfigService.baseUrl}/${mockShortUrl}`,
    });
  });

  it('should increase access count and save the document when a short URL is found', async () => {
    const mockDocument = {
      originalUrl: 'https://mediotiempo.com',
      accessCount: 0,
      save: jest.fn().mockResolvedValue(null),
    };

    jest.spyOn(model, 'findOne').mockResolvedValueOnce(mockDocument);

    const mockShortUrl = 'abc123';
    await service.redirectToOriginalUrl(mockShortUrl);

    expect(mockDocument.accessCount).toBe(1);
    expect(mockDocument.save).toHaveBeenCalledTimes(1);
  });

  it('should return the top 100 most accessed URLs', async () => {
    const mockedUrls = Array.from({ length: 100 }, (_, index) => ({
      originalUrl: `https://mediotiempo${index}.com`,
      shortUrl: `http://localhost:3000/abc${index}`,
      title: `Title ${index}`,
      accessCount: 100 - index,
    }));

    model.exec.mockResolvedValue(mockedUrls);

    const result = await service.getTopUrls();

    expect(result).toEqual(mockedUrls);
    expect(model.find).toHaveBeenCalled();
    expect(model.sort).toHaveBeenCalledWith({ accessCount: -1 });
    expect(model.limit).toHaveBeenCalledWith(100);
  });
});

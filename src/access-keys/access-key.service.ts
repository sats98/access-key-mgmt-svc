import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessKey } from './access-key.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AccessKeyService {
  constructor(
    @InjectRepository(AccessKey)
    private readonly accessKeyRepository: Repository<AccessKey>,
    private readonly redisService: RedisService,
  ) { }

  async findAll(): Promise<AccessKey[]> {
    return this.accessKeyRepository.find();
  }

  async findOne(id: number): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({ where: { id } });
    if (!accessKey) {
      return null;
    }
    return accessKey;
  }

  async create(key: string, rateLimit: number, expiration: Date): Promise<AccessKey> {
    const accessKey = new AccessKey();
    accessKey.key = key;
    accessKey.rateLimit = rateLimit;
    accessKey.expiration = expiration;
    const savedKey = await this.accessKeyRepository.save(accessKey);
    await this.redisService.publish('access_key_created', savedKey);

    return savedKey;
  }

  async update(id: number, rateLimit: number, expiration: Date): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({ where: { id } });
    if (!accessKey) {
      return null;
    }
    accessKey.rateLimit = rateLimit;
    accessKey.expiration = expiration;
    const updatedKey = await this.accessKeyRepository.save(accessKey);

    await this.redisService.publish('access_key_updated', updatedKey);

    return updatedKey;
  }

  async remove(id: number): Promise<void> {
    await this.accessKeyRepository.delete(id);
    await this.redisService.publish('access_key_deleted', { id });
  }
}

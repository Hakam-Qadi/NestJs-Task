import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { serviceConfig } from 'src/config/env.config';

@Injectable()
export class AdviceService {
  constructor(private readonly httpService: HttpService) { }

  async getAdvice(): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.get(serviceConfig.api.adviceApiUrl);
      return response.data?.slip?.advice || 'Stay motivated!';
    } catch (error) {
      return 'Stay motivated!';
    }
  }
}

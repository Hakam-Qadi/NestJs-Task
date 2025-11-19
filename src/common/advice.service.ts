import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AdviceService {
  constructor(private readonly httpService: HttpService) {}

  async getAdvice(): Promise<string> {
    try {
      const response = await this.httpService.axiosRef.get('https://api.adviceslip.com/advice');
      return response.data?.slip?.advice || 'Stay motivated!';
    } catch (error) {
      return 'Stay motivated!';
    }
  }
}

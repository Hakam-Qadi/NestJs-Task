import { Module } from '@nestjs/common';
import { AdviceService } from './integrations/advice.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [AdviceService],
  exports: [AdviceService],
})
export class CommonModule {}

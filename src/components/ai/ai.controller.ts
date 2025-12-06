import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AiController {
    constructor(
        private AiService: AiService,
    ) { }


    @Post()
    @ApiBody({ type: SendMessageDto })
    async sendMessage(@Body() dto: SendMessageDto) {
        const reply = await this.AiService.sendMessage(dto);
        return { reply };
    }

    @Get('enhance-task/:id')
    async enhanceTask(@Req() req: any, @Param('id') id: string) {
        return await this.AiService.enhanceTask(req.user.id, id);
    }

}
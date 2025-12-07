import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { serviceConfig } from '../../config/env.config';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from 'prisma/prisma.service';
import { MessageEnum } from '../../common/enums/message.enum';

@Injectable()
export class AiService {
    private model;

    constructor(
        private prisma: PrismaService,
    ) {
        const genAI = new GoogleGenerativeAI(
            serviceConfig.ai.googleApiKey || "",
        );

        this.model = genAI.getGenerativeModel({
            model: serviceConfig.ai.aiModel || "",
        });
    }

    async sendMessage(dto: SendMessageDto) {
        try {
            const result = await this.model.generateContent(dto.message);
            return result.response.text();
        } catch (error) {
            console.error('Gemini Error :: ', error.message);
            if (error.status === 429) {
                throw new InternalServerErrorException(MessageEnum.error.RATE_LIMITED)
            }
            throw new InternalServerErrorException('AI service failed: ' + error.message);
        }
    }

    async enhanceTask(userId: string, id: string) {
        try {
            const task = await this.prisma.task.findUnique({
                where: { id },
                include: { user: true },
            });

            if (!task) throw new NotFoundException(MessageEnum.error.TASK_NOT_FOUND)
            if (task.userId !== userId)
                throw new ForbiddenException(MessageEnum.error.ACCESS_DENIED);

            const prompt = MessageEnum.ai.ENHANCE_TASK_PROMPT
                .replace('{{title}}', task.title)
                .replace(
                    '{{description}}',
                    task.description ? `"${task.description}"` : 'null',
                );

            const result = await this.model.generateContent(prompt);
            let output = result.response.text();

            output = output.replace(/```json|```/g, '').trim();

            // Parse the returned JSON
            const enhanced = JSON.parse(output);

            // Ensure description stays null if original is null
            const newDescription =
                task.description === null ? null : enhanced.description;

            // Update the task using your update service
            const updated = await this.prisma.task.update({
                where: { id: task.id },
                data: {
                    title: enhanced.title,
                    description: newDescription,
                },
            });

            return updated;
        } catch (error) {
            console.error('Enhance Task Error :: ', error.message);

            if (error.status === 429) {
                throw new InternalServerErrorException(MessageEnum.error.RATE_LIMITED);
            }

            throw new InternalServerErrorException(error.message);
        }
    }
}

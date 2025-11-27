import {
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMessageDto } from './dto/send-message.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AiService {
    private model;

    constructor(
        private prisma: PrismaService,
        configService: ConfigService,
    ) {
        const genAI = new GoogleGenerativeAI(
            configService.get<string>('GOOGLE_API_KEY') || "",
        );

        this.model = genAI.getGenerativeModel({
            model: configService.get<string>('AI_MODEL') || "",
        });
    }

    async sendMessage(dto: SendMessageDto) {
        try {
            const result = await this.model.generateContent(dto.message);
            return result.response.text();
        } catch (error) {
            console.error('Gemini Error :: ', error);
            throw new Error('AI service failed: ' + error.message);
        }
    }

    async enhanceTask(userId: string, id: string) {
        try {
            const task = await this.prisma.task.findUnique({
                where: { id },
                include: { user: true },
            });

            if (!task) throw new NotFoundException('Task not found');
            if (task.userId !== userId)
                throw new ForbiddenException('Access denied');

            const prompt = `
        Rewrite the following task title and description ONLY if they exist.
        If the description is null, DO NOT create one — return it as null.

        Return ONLY valid JSON with the fields "title" and "description".
        No explanations, no notes, no markdown. Do NOT include backticks.

        Input:
        {
          "title": "${task.title}",
          "description": ${task.description ? `"${task.description}"` : null}
        }

        Output (JSON only):
        {
          "title": "",
          "description": null
        }
      `;

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
            console.error('Enhance Task Error :: ', error);

            if (
                error instanceof NotFoundException ||
                error instanceof ForbiddenException
            ) {
                throw error;
            }

            throw new InternalServerErrorException(error.message);
        }
    }
}

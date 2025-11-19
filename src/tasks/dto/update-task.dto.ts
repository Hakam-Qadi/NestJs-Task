import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString } from "class-validator";

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: "Updated task title" })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: "Updated description" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: "IN_PROGRESS" })
    @IsOptional()
    @IsString()
    status?: string; // pending | in-progress | completed

    @ApiPropertyOptional({
        example: "2025-11-19T15:00:00.000Z"
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

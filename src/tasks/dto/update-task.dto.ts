import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsEnum } from "class-validator";

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: "Updated task title" })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: "Updated description" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: "IN_PROGRESS", enum: ["PENDING", "IN_PROGRESS", "COMPLETED"] })
    @IsOptional()
    @IsString()
    @IsEnum(["PENDING", "IN_PROGRESS", "COMPLETED"], { message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' })
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";

    @ApiPropertyOptional({
        example: "2025-11-19T15:00:00.000Z"
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

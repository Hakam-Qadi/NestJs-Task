import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsEnum } from "class-validator";
import { MessageEnum } from "../../../common/enums/message.enum";
import { TaskStatus } from "../../../common/enums/task.enum";

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: MessageEnum.swaggerExample.UPDATED_TITLE })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: MessageEnum.swaggerExample.UPDATED_DESCRIPTION })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: MessageEnum.swaggerExample.STATUS, enum: TaskStatus })
    @IsOptional()
    @IsString()
    @IsEnum(TaskStatus, { message: MessageEnum.swaggerExample.VALIDATION.INVALID_STATUS })
    status?: TaskStatus;

    @ApiPropertyOptional({
        example: MessageEnum.swaggerExample.UPDATED_DUE_DATE,
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

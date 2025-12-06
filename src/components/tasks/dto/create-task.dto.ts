import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsNotEmpty } from "class-validator";
import { MessageEnum } from "../../../common/enums/message.enum";

export class CreateTaskDto {
    @ApiProperty({ example: MessageEnum.swaggerExample.TITLE })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: MessageEnum.swaggerExample.DESCRIPTION })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: MessageEnum.swaggerExample.DUE_DATE,
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { MessageEnum } from "../../../common/enums/message.enum";

export class SendMessageDto {
    @ApiProperty({ example: MessageEnum.swaggerExample.MESSAGE })
    @IsString()
    @IsNotEmpty()
    message: string;
}
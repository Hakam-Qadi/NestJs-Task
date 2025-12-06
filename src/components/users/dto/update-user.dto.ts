import { ApiProperty } from "@nestjs/swagger";
import {
    IsString,
    MinLength,
    MaxLength,
    Matches,
    IsOptional
} from "class-validator";
import { MessageEnum } from "../../../common/enums/message.enum";

export class UpdateUserDto {


    @ApiProperty({
        example: MessageEnum.swaggerExample.UPDATED_NAME,
        minLength: 2,
        maxLength: 50,
    })
    @IsString()
    @IsOptional()
    @MinLength(2, { message: MessageEnum.swaggerExample.VALIDATION.NAME_MIN_LENGTH })
    @MaxLength(50, { message: MessageEnum.swaggerExample.VALIDATION.NAME_MAX_LENGTH })
    name?: string;

    @ApiProperty({
        example: MessageEnum.swaggerExample.UPDATED_PASSWORD,
        minLength: 8,
    })
    @IsString()
    @IsOptional()
    @MinLength(8, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_MIN_LENGTH })
    @MaxLength(100, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_MAX_LENGTH })
    @Matches(/(?=.*[A-Z])/, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_UPPERCASE })
    @Matches(/(?=.*[a-z])/, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_LOWERCASE })
    @Matches(/(?=.*\d)/, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_NUMBER })
    @Matches(/(?=.*[@$!%*?&])/, { message: MessageEnum.swaggerExample.VALIDATION.PASSWORD_SPECIAL_CHAR })
    password?: string;
}
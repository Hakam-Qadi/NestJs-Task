import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsNotEmpty } from "class-validator";

export class CreateTaskDto {
    @ApiProperty({ example: "Finish project report" })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: "Prepare slides and summary" })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: "2025-12-01T15:00:00.000Z",
    })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

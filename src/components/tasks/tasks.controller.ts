import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AdviceService } from '../../common/integrations/advice.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly adviceService: AdviceService,
  ) { }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTaskDto) {
    const task = await this.tasksService.create(req.user.id, dto);
    const advice = await this.adviceService.getAdvice();
    return { task, advice };
  }

  @Get()
  findAll(@Req() req: any,
    @Query('page', ParseIntPipe, new DefaultValuePipe(1)) page: number,
    @Query('count', ParseIntPipe, new DefaultValuePipe(10)) count: number) {
    return this.tasksService.findAll(req.user.id, page, count);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const task = await this.tasksService.findOne(req.user.id, id);
    const advice = await this.adviceService.getAdvice();
    return { task, advice };
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.remove(req.user.id, id);
  }
}

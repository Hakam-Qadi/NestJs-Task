import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/components/users/entities/user.entity';

@Entity()
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
        default: 'PENDING',
    })
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

    @Column({ type: 'timestamp', nullable: true })
    dueDate: Date | null;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

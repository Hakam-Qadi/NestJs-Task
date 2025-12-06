import 'dotenv/config';
import { PrismaClient } from "../src/generated/prisma/client";
import { TaskStatus } from "../src/generated/prisma/enums";
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();


async function main() {
    console.log("Seeding database...");

    const users = [
        {
            name: "John Doe",
            email: "john@example.com",
            password: "StrongPass@123",
            tasks: [
                {
                    title: "Finish TypeScript course",
                    description: "Complete all remaining modules",
                    status: TaskStatus.PENDING,
                    dueDate: new Date("2025-02-01"),
                },
                {
                    title: "Review pull requests",
                    status: TaskStatus.IN_PROGRESS,
                    dueDate: new Date("2025-01-15"),
                }
            ]
        },
        {
            name: "Sarah Connor",
            email: "sarah@example.com",
            password: "StrongPass@123",
            tasks: [
                {
                    title: "Prepare task management demo",
                    description: "For the upcoming client meeting",
                    status: TaskStatus.COMPLETED,
                    dueDate: new Date("2024-12-20"),
                }
            ]
        },
        {
            name: "Hakam Qadi",
            email: "hakam@example.com",
            password: "StrongPass@123",
            tasks: [
                {
                    title: "Prepare task management demo",
                    description: "For the upcoming client meeting",
                    status: TaskStatus.COMPLETED,
                    dueDate: new Date("2024-12-20"),
                }
            ]
        }
    ];

    for (const user of users) {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
        });
        if (existingUser) {
            console.log(`User with email ${user.email} exists — skipping.`);
        } else {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await prisma.user.create({
                data: {
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    tasks: {
                        create: user.tasks
                    }
                }
            });
            console.log(`User ${user.email} inserted successfully.`);
        }
    }
    console.log("Seeding completed.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
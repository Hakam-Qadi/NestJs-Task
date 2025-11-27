import { PrismaClient } from "@prisma/client";
// add seed files for each section in seed folder
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");
    await prisma.user.create({
        data: {
            name: "John Doe",
            email: "john@example.com",
            password: "Hakam@2000",

            tasks: {
                create: [
                    {
                        title: "Finish TypeScript course",
                        description: "Complete all remaining modules",
                        status: "PENDING",
                        dueDate: new Date("2025-02-01"),
                    },
                    {
                        title: "Review pull requests",
                        status: "IN_PROGRESS",
                        dueDate: new Date("2025-01-15"),
                    }
                ]
            }
        }
    });
    await prisma.user.create({
        data: {
            name: "Sarah Connor",
            email: "sarah@example.com",
            password: "Hakam@2000",

            tasks: {
                create: [
                    {
                        title: "Prepare task management demo",
                        description: "For the upcoming client meeting",
                        status: "COMPLETED",
                        dueDate: new Date("2024-12-20"),
                    }
                ]
            }
        }
    });
    console.log("Seeding completed.");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
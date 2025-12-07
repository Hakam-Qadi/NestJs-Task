
# NestJs-Task

A full-featured NestJS project with authentication, user, and task management, using Prisma ORM and PostgreSQL. Includes modular architecture, robust error handling, and ready-to-use Docker and Prisma configurations.


## Features

- User authentication (JWT & local strategies)
- User CRUD (register, login, update, etc.)
- Task CRUD (create, update, delete, list)
- Refresh token support
- Global exception filter & response interceptor
- Modular, scalable code structure
- Prisma ORM with migrations & seeding
- Dockerized PostgreSQL support
- Swagger API documentation

## Project Structure

```
src/
	app.module.ts           # Root module
	main.ts                 # Application entry point
	common/                 # Shared modules, enums, guards, filters, interceptors, strategies
		enums/                # Enum definitions
		filters/              # Global exception filter
		guards/               # Auth guards
		integrations/         # External integrations (e.g., advice service)
		interceptors/         # Response interceptors
		strategies/           # Auth strategies
		utility/              # Utility functions (e.g., cookies)
	components/
		ai/                   # AI integration (optional)
		auth/                 # Auth logic (controllers, services, DTOs)
		tasks/                # Task logic (controllers, services, DTOs)
		users/                # User logic (controllers, services, DTOs)
	config/                 # App config (env, swagger, validation)
	generated/              # Prisma generated client
test/                     # End-to-end tests
prisma/                   # Prisma schema, migrations, seed
```




## Prisma Setup & Usage

Prisma is used for database access, migrations, and seeding.


### Migrations

To apply schema changes and update the database:

```powershell
npm run migrate:dev
```
or
```powershell
npx prisma migrate dev --name <migration-name>
```

### Seeding

To seed the database with initial data:

```powershell
npm run seed
```
or
```powershell
npx prisma db seed
```

The seed script is idempotent and logs actions for each record.

### Prisma Studio

To open Prisma Studio (visual DB browser):

```powershell
npx prisma studio
```

For more, see [Prisma docs](https://www.prisma.io/docs/).


## Prerequisites

- Node.js (v16+ recommended)
- npm or Yarn
- PostgreSQL (local or Docker)


## Installation

Clone the repo and install dependencies:

```powershell
git clone <repo-url>
cd NestJs-Task
npm install
```


## Environment

Create a `.env` file in the project root. Example:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_task
JWT_SECRET=your_jwt_secret
```



## Database

This project uses PostgreSQL. You can use Docker Compose (recommended) or connect to your own instance.

### Using Docker Compose

Start a PostgreSQL container:

```powershell
docker-compose up -d
```

Stop the container:

```powershell
docker-compose down
```

Ensure your `.env` matches the credentials in `docker-compose.yml`.

### Manual Connection

If using your own PostgreSQL, update `.env` accordingly. Example test command:

```powershell
psql "host=localhost port=5432 dbname=nestjs_task user=postgres password=postgres" -c "SELECT 1;"
```


## Common Scripts

Check `package.json` for all scripts. Most common:

- Start in development (watch mode):
	```powershell
	npm run start:dev
	```
- Build and start production:
	```powershell
	npm run build
	npm run start:prod
	```
- Run unit tests:
	```powershell
	npm run test
	```
- Run e2e tests:
	```powershell
	npm run test:e2e
	```


## Build

```powershell
npm run build
```

Compiled files are in `dist/`. Start with:

```powershell
npm run start:prod
# or
node dist/main.js
```


## API Documentation

Swagger is enabled. After starting the app, visit:

```
http://localhost:3000/api/docs
```

to view and interact with the API docs.


## Testing

Run unit tests:

```powershell
npm run test
```

Run e2e tests:

```powershell
npm run test:e2e
```


## Troubleshooting

- If the server does not start, check if `PORT` is in use.
- If authentication fails, ensure `JWT_SECRET` is correct.
- If a script fails, check `package.json` for available scripts.


## Development Notes

- Main modules: `auth`, `users`, `tasks`, `ai` (see `src/components/`)
- Entry point: `src/main.ts`


## Contributing

Contributions are welcome! Open issues or submit pull requests.


## License

No explicit license. Add a `LICENSE` file if you plan to distribute or reuse this code.
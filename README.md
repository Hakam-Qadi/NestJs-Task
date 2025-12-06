# NestJs-Task

A minimal NestJS example project with authentication, users and tasks modules.

## Features

- User authentication with JWT and local strategies
- User management (CRUD)
- Task management (CRUD)
- Global exception handling and response interceptors
- Modular structure for scalability

## Project Structure

```
src/
	app.module.ts           # Root module
	main.ts                 # Application entry point
	common/                 # Shared modules, guards, filters, interceptors, strategies
	components/
		auth/                 # Authentication logic (controllers, services, DTOs)
		tasks/                # Task management (controllers, services, DTOs, entities)
		users/                # User management (controllers, services, DTOs, entities)
	config/                 # Configuration files (env, swagger, validation)
test/                     # End-to-end tests
```


## Prisma Setup & Usage

Prisma is used for database access and migrations in this project.

### 1. Initialize Prisma

If you need to initialize Prisma in a new project:

```shell
npx prisma init
```

This creates the `prisma/` folder with `schema.prisma`.

### 2. Run Migrations

To apply schema changes to your database:

```shell
npx prisma migrate dev --name <migration-name>
```

This creates a new migration and updates your database.

### 3. Open Prisma Studio

To visually inspect and edit your database:

```shell
npx prisma studio
```

This opens a web UI for your database.

### 4. Seed the Database

To seed initial data:

```shell
npx prisma db seed
```

For more details, see the [Prisma documentation](https://www.prisma.io/docs/).

## Prerequisites

- Node.js (v16 or later recommended)
- npm (comes with Node) or Yarn
- Windows PowerShell (this repository was edited on Windows; PowerShell examples provided)

## Install

Clone the repo and install dependencies:

```powershell
git clone <repo-url>
cd NestJs-Task
npm install
```

If you prefer Yarn:

```powershell
yarn install
```

## Environment

Create a `.env` file in the project root (the app may read environment variables directly). Example values:

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=pass1234
DB_NAME=my_database

JWT_SECRET=dummy_jwt_secret

```


## Database

This project expects a PostgreSQL database. You can run the database using Docker (recommended) or connect to an existing instance.

### Using Docker Compose

This repository includes a `docker-compose.yml` file to quickly start a PostgreSQL database in a container. To start the database:

```powershell
docker-compose up -d
```

This will launch a PostgreSQL container with the configuration specified in `docker-compose.yml`. Make sure your `.env` file matches the credentials and database name set in the compose file.

To stop the database:

```powershell
docker-compose down
```

### Manual Connection

If you prefer to use your own PostgreSQL instance, configure your connection in the `.env` file as shown above. Make sure the database exists and credentials are correct. Example command to test connection (using psql):

```powershell
psql "host=localhost port=5432 dbname=my_database user=user password=pass1234" -c "SELECT 1;"
```

You may need to create the database manually if it does not exist.

## Common scripts

Most NestJS projects include standard npm scripts. Check `package.json` for exact names. Typical commands:

- Start in development (watch mode):

```powershell
npm run start:dev
```

- Start production (build first):

```powershell
npm run build
npm run start:prod
```

- Run tests (unit):

```powershell
npm run test
```

## Build

```powershell
npm run build
```

The compiled files will be in the `dist/` folder (default for NestJS). Start the compiled app with `npm run start:prod` or node directly:

```powershell
node dist/main.js
```

## API Documentation

This project uses Swagger for API documentation. Once the app is running, visit:

```
http://localhost:3000/api/docs
```

to view and interact with the API docs (URL may vary if you change the port).

## Tests

Run unit tests with Jest:

```powershell
npm run test
```

Run e2e tests (if present):

```powershell
npm run test:e2e
```

## Troubleshooting

- If the server does not start, confirm `PORT` is not already in use.
- If authentication fails, ensure `JWT_SECRET` matches what was used to sign tokens.
- If a script name from this README fails, open `package.json` and use the scripts listed there.

## Development notes

- Modules in this repo: `auth`, `users`, and `tasks` (see `src/` for code).
- Typical NestJS entrypoint: `src/main.ts`.

## Contributing

Feel free to open issues or submit pull requests.

## License

This project does not include an explicit license file. If you intend to reuse or distribute code, add a `LICENSE` file or consult the repository owner.
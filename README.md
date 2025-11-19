# NestJs-Task

A minimal NestJS example project with authentication, users and tasks modules.

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
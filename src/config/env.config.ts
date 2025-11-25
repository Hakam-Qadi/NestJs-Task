import { envVars } from "./validate-env.config";

export const serviceConfig = {
    service: {
        nodeEnv: envVars.NODE_ENV,
        appName: envVars.APP_NAME,
        appVersion: envVars.APP_VERSION,
        jwtSecret: envVars.JWT_SECRET,
    },
    db: {
        port: envVars.DB_PORT,
        host: envVars.DB_HOST,
        username: envVars.DB_USERNAME,
        password: envVars.DB_PASSWORD,
        name: envVars.DB_NAME,
    },
    api: {
        adviceApiUrl: envVars.ADVICE_API_URL,
    },
    ai: {
        googleApiKey: envVars.GOOGLE_API_KEY,
        aiModel: envVars.AI_MODEL,
    }
};
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB_URL: string;
      SUPABASE_API_KEY: string;
      SUPABASE_DB_PW: string;
      SUPABASE_URL: string;
      SUPABASE_SERVICE_KEY: string;
      DATABASE_URL: string;
    }
  }
}

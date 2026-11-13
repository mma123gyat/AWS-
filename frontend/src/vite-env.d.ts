/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AWS_REGION: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_USER_POOL_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_DEV_STUDENT_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

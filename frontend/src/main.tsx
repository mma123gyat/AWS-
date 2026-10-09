import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID

if (!userPoolId || !userPoolClientId) {
  throw new Error(
    'VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_USER_POOL_CLIENT_ID が設定されていません。frontend/.env を確認してください。',
  )
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: { email: true },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
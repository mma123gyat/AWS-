import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-northeast-1_ng4VjGfuy',
      userPoolClientId: '3t31is75ku7j59p374efajibgi',
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
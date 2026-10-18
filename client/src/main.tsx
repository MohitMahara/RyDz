import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme/theme-provider.tsx"
import { AuthProvider } from "@/contexts/authContext.tsx"
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

const app = (
  <ThemeProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {recaptchaSiteKey ? (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        {app}
      </GoogleReCaptchaProvider>
    ) : (
      app
    )}
  </StrictMode>
)

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks'
import { ProtectedRoute } from '@/components/layout'
import { LoginPage, MagicLinkVerifyPage, NeuralTestPage, NeuralHomePage } from '@/pages'
import { NeuralNetworkProvider } from '@/contexts/NeuralNetworkContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
          <Route path="/neural-test" element={<NeuralTestPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <NeuralNetworkProvider>
                  <NeuralHomePage />
                </NeuralNetworkProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

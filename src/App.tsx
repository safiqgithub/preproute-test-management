import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateTestPage } from './pages/CreateTestPage';
import { AddQuestionsPage } from './pages/AddQuestionsPage';
import { PreviewPublishPage } from './pages/PreviewPublishPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '10px', fontSize: '14px', fontFamily: 'Plus Jakarta Sans, sans-serif' },
          success: { iconTheme: { primary: '#4F6BF4', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tests/create" element={<CreateTestPage />} />
          <Route path="/tests/:id/edit" element={<CreateTestPage />} />
          <Route path="/tests/:id/questions" element={<AddQuestionsPage />} />
          <Route path="/tests/:id/preview" element={<PreviewPublishPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

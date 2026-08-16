import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/features/auth/auth-provider";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/route-guards";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { DataRoomPage } from "@/features/data-room/data-room-page";
import { FolderPage } from "@/features/data-room/folder-page";
import { RoomPage } from "@/features/data-room/room-page";
import { PublicSharePage } from "@/features/sharing/public-share-page";
import { SharedWithMePage } from "@/features/sharing/shared-with-me-page";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DataRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/folder/:id"
          element={
            <ProtectedRoute>
              <FolderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:id"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shared-with-me"
          element={
            <ProtectedRoute>
              <SharedWithMePage />
            </ProtectedRoute>
          }
        />
        <Route path="/share/:token" element={<PublicSharePage />} />
        <Route path="/share/:token/folders/:folderId" element={<PublicSharePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;

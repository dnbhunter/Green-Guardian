import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SignIn from './pages/SignIn';
import Chat from './pages/Chat';
import Dashboards from './pages/Dashboards';
import Datasets from './pages/Datasets';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './types/auth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboards',
        element: (
          <ProtectedRoute>
            <Dashboards />
          </ProtectedRoute>
        ),
      },
      {
        path: 'datasets',
        element: (
          <ProtectedRoute>
            <Datasets />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <Admin />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

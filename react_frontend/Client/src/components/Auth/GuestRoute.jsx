import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../creatContext'

export default function GuestRoute({ children, redirectTo = '/' }) {
  const [auth] = useAuth();

  // If user is logged in (has token or isLoggedIn), redirect to `redirectTo`
  if (auth?.token || auth?.isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  // Otherwise render the child (guest-only) component
  return children;
}

import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../api/axios';

/**
 * PrivateRoute — wraps any route that requires login.
 * If the user is not authenticated, redirects to /login.
 */
export default function PrivateRoute({ children }) {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

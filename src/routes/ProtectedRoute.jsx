import { Navigate, useLocation } from "react-router-dom";
import { hasPasscodeAccepted } from "../auth/passcode";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!hasPasscodeAccepted()) {
    return (
      <Navigate to="/security" replace state={{ from: location.pathname }} />
    );
  }

  return children;
};

export default ProtectedRoute;

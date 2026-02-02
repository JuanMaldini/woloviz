import type { ReactElement } from "react";

type SpinnerSize = "small" | "medium" | "large";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  message?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: "spinner-small",
  medium: "spinner-medium",
  large: "spinner-large",
};

const LoadingSpinner = ({ size = "medium", message = "Cargando..." }: LoadingSpinnerProps): ReactElement => {
  const resolvedClass = sizeClasses[size] ?? sizeClasses.medium;

  return (
    <div className="loading-spinner-container">
      <div className={`loading-spinner ${resolvedClass}`}>
        <div className="spinner"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;

import styled from "styled-components";
import { useUser } from "../features/authentication/useUser";
import Spinner from "./Spinner";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const FullPage = styled.div`
  height: 100vh;
  background-color: var(--color-grey-50);
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();

  // 1. Load authenticated user
  const { isLoading, isAuthenticated, fetchStatus } = useUser();

  // 2. If no authenticated user, redirect to /login page
  useEffect(
    function () {
      if (!isAuthenticated && !isLoading && fetchStatus !== "fetching") {
        navigate("/login");
      }
    },
    [isAuthenticated, isLoading, navigate, fetchStatus],
  );

  // 3. While loading, show spinner
  if (isLoading)
    return (
      <FullPage>
        <Spinner />
      </FullPage>
    );

  // 4. If there is a user, render the app
  return children;
}

export default ProtectedRoute;

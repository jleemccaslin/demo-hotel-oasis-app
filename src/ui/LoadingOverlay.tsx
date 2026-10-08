import styled from "styled-components";
import Spinner from "./Spinner";

// ============ TYPES ============
interface LoadingOverlayProps {
  message: string;
}

// ============ STYLES ============
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--backdrop-color);
  backdrop-filter: blur(4px);
  z-index: 1000;
`;

const Message = styled.p`
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--color-grey-700);
`;

// ============ COMPONENT ============
function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <Overlay role="status" aria-live="polite">
      <Spinner />
      <Message>{message}</Message>
    </Overlay>
  );
}

export default LoadingOverlay;

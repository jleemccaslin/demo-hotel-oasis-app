import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { HiEllipsisVertical } from "react-icons/hi2";
import styled from "styled-components";
import { useOutsideClick } from "../hooks/useOutsideClick";

// ============ TYPES ============
interface Position {
  x: number;
  y: number;
}

interface MenusContextType {
  openID: string;
  close: () => void;
  open: (id: string) => void;
  position: Position | null;
  setPosition: Dispatch<SetStateAction<Position | null>>;
}

interface MenusProps {
  children: React.ReactNode;
}

interface ToggleProps {
  id: string;
}

interface ListProps {
  id: string;
  children: React.ReactNode;
}

interface ButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

interface StyledListProps {
  $position: Position;
}

// ============ STYLED COMPONENTS ============
const Menu = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const StyledToggle = styled.button`
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: var(--border-radius-sm);
  transform: translateX(0.8rem);
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-grey-100);
  }

  & svg {
    width: 2.4rem;
    height: 2.4rem;
    color: var(--color-grey-700);
  }
`;

const StyledList = styled.ul<StyledListProps>`
  position: fixed;
  background-color: var(--color-grey-0);
  box-shadow: var(--shadow-md);
  border-radius: var(--border-radius-md);
  right: ${(props) => props.$position.x}px;
  top: ${(props) => props.$position.y}px;
`;

const StyledButton = styled.button`
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 1.2rem 2.4rem;
  font-size: 1.4rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 1.6rem;

  &:hover {
    background-color: var(--color-grey-50);
  }

  & svg {
    width: 1.6rem;
    height: 1.6rem;
    color: var(--color-grey-400);
    transition: all 0.3s;
  }
`;

// ============ CONTEXT ============
const MenusContext = createContext<MenusContextType | undefined>(undefined);

function useMenusContext() {
  const context = useContext(MenusContext);
  if (context === undefined) {
    throw new Error("Menu components must be used within a Menus component");
  }
  return context;
}

// ============ MAIN COMPONENT ============
function Menus({ children }: MenusProps) {
  const [openID, setOpenID] = useState("");
  const [position, setPosition] = useState<Position | null>(null);

  const close = () => setOpenID("");
  const open = (id: string) => setOpenID(id);

  return (
    <MenusContext.Provider
      value={{ openID, close, open, position, setPosition }}
    >
      {children}
    </MenusContext.Provider>
  );
}

// ============ SUB-COMPONENTS ============
function Toggle({ id }: ToggleProps) {
  const { openID, close, open, setPosition } = useMenusContext();

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: window.innerWidth - rect.width - rect.x,
      y: rect.y + rect.height + 8,
    });

    openID === id ? close() : open(id);
  }

  return (
    <StyledToggle onClick={handleClick}>
      <HiEllipsisVertical />
    </StyledToggle>
  );
}

function List({ id, children }: ListProps) {
  const { openID, close, position } = useMenusContext();
  const ref = useOutsideClick(() => {
    close();
  }, false);

  if (openID !== id || !position) return null;

  return createPortal(
    <StyledList $position={position} ref={ref}>
      {children}
    </StyledList>,
    document.body,
  );
}

function Button({ children, icon, onClick, disabled }: ButtonProps) {
  const { close } = useMenusContext();

  function handleClick() {
    onClick?.();
    close();
  }

  return (
    <li>
      <StyledButton onClick={handleClick} disabled={disabled}>
        {icon}
        <span>{children}</span>
      </StyledButton>
    </li>
  );
}

// ============ COMPOUND COMPONENT PATTERN ============
Menus.Menu = Menu;
Menus.Toggle = Toggle;
Menus.List = List;
Menus.Button = Button;

export default Menus;

import styled, { css, RuleSet } from "styled-components";

type Type = "horizontal" | "vertical";

interface RowProps {
  type?: Type;
  children: React.ReactNode;
}

const types: Record<Type, RuleSet> = {
  horizontal: css`
    justify-content: space-between;
    align-items: center;
  `,
  vertical: css`
    flex-direction: column;
    gap: 1.6rem;
  `,
};

const Row = styled.div<RowProps>`
  display: flex;

  ${(props) => types[props.type || "vertical"]};
`;

export default Row;

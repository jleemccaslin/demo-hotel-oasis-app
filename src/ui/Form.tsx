import styled, { css, RuleSet } from "styled-components";

type Type = "regular" | "modal";

interface FormProps {
  type?: Type;
  children?: React.ReactNode;
}

const types: Record<Type, RuleSet> = {
  regular: css`
    padding: 2.4rem 4rem;
    background-color: var(--color-grey-0);
    border: 1px solid var(--color-grey-100);
    border-radius: var(--border-radius-md);
  `,
  modal: css`
    width: 80rem;
  `,
};

const Form = styled.form<FormProps>`
  overflow: hidden;
  font-size: 1.4rem;
  ${(props) => types[props.type || "regular"]};
`;

export default Form;

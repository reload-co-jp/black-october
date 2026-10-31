import { ComponentProps, FC, ReactNode } from "react"

export const Title: FC<ComponentProps<"h1">> = ({
  style,
  children,
  ...props
}) => (
  <h1 style={{ fontSize: "1rem", margin: 0, ...style }} {...props}>
    {children}
  </h1>
)

export const Header: FC<{ children: ReactNode }> = ({ children }) => (
  <header
    style={{
      alignItems: "center",
      backgroundColor: "#010409",
      borderBottom: "1px solid #30363d",
      display: "flex",
      flexWrap: "wrap",
      gap: ".5rem 1.5rem",
      justifyContent: "space-between",
      padding: "1rem",
      position: "relative",
    }}
  >
    {children}
  </header>
)

export const Main: FC<{ children: ReactNode }> = ({ children }) => (
  <main
    style={{
      margin: "0 auto",
      maxWidth: "72rem",
      minHeight: "calc(100dvh - 8rem)",
      padding: "1rem",
    }}
  >
    {children}
  </main>
)

export const Footer: FC<{ children: ReactNode }> = ({ children }) => (
  <footer
    style={{
      borderTop: "1px solid #30363d",
      color: "#8b949e",
      fontSize: ".75rem",
      padding: "1.5rem 1rem",
      textAlign: "center",
    }}
  >
    {children}
  </footer>
)

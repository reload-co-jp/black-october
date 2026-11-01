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
      backgroundColor: "#010409",
      borderBottom: "1px solid #30363d",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "16px 16px 0",
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
      maxWidth: "1280px",
      minHeight: "calc(100dvh - 10rem)",
      padding: "24px 16px",
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
      fontSize: "12px",
      margin: "0 auto",
      maxWidth: "1280px",
      padding: "24px 16px 40px",
    }}
  >
    {children}
  </footer>
)

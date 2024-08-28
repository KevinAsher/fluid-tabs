import React from "react";
import classes from "./FluidTabPanel.module.scss";
import clsx from "clsx";

interface Props {
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  component: React.ElementType;
  rest: any;
}

export default function FluidTabPanel({
  style,
  className,
  children,
  component: Component = "div",
  ...rest
}: Props) {
  return (
    <Component
      className={clsx(classes.root, className)}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}

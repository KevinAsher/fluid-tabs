import React from "react";
import classes from "./FluidTabPanel.module.scss";
import clsx from "clsx";

interface Props {
  style: React.CSSProperties;
  className: string;
  children: React.ReactNode;
  component: React.ElementType;
  innerScroll: boolean;
  rest: any;
}

export default function FluidTabPanel({
  style,
  className,
  children,
  component: Component = "div",
  innerScroll = false,
  ...rest
}: Props) {
  return (
    <Component
      className={clsx(
        classes.root,
        { [classes.innerScroll]: innerScroll },
        className,
      )}
      style={style}
      {...rest}
    >
      {children}
    </Component>
  );
}

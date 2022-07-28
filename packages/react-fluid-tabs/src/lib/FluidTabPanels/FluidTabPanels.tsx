import React from 'react';
import classes from './FluidTabPanels.module.scss';
import clsx from 'clsx';

interface Props {
  style: React.CSSProperties;
  className: string; 
  children: React.ReactNode;
  component: React.ElementType;
  tabPanelsRef: React.RefObject<HTMLElement>;
  rest: any;
}

const FluidTabPanels = React.forwardRef(({style, className, children, component: Component='div', ...rest}: Props, ref) => 
  <Component className={clsx(classes.root, className)} style={style} ref={ref} {...rest}>
    {children}
  </Component>
);

export default FluidTabPanels;
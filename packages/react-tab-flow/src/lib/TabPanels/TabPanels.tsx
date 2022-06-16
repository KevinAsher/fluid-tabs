import React from 'react';
import classes from './TabPanels.module.scss';
import clsx from 'clsx';

interface Props {
  style: React.CSSProperties;
  className: string; 
  children: React.ReactNode;
  component: React.ElementType;
  rest: any;
}

const TabPanels = React.forwardRef( function TabPanels({style, className, children, component: Component='div', ...rest}: Props, ref) {
  return (
    <Component className={clsx(classes.root, className)} style={style} ref={ref} {...rest}>
      {children}
    </Component>
  )
});

export default TabPanels;
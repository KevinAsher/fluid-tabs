import React from 'react';
import classes from './TabPanel.module.scss';
import clsx from 'clsx';

interface Props {
  style: React.CSSProperties;
  className: string; 
  children: React.ReactNode;
  component: React.ElementType;
  rest: any;
} 

export default function TabPanel({style, className, children, component: Component='div', ...rest}: Props) {

  return (
    <Component className={clsx(classes.root, className)} style={style} {...rest}>
      {children}
    </Component>
  )
}
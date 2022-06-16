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

const defaultStyles = {
  // display: 'flex',
  // scrollSnapType: 'x mandatory',
  // // scrollSnapStop: 'always',
  // WebkitOverflowScrolling: 'touch',
  // overflowX: 'scroll',
};

const TabPanels = React.forwardRef( function TabPanels({style, className, children, component: Component='div', ...rest}: Props, ref) {
  return (
    <Component className={clsx(classes.root, className)} style={{...defaultStyles, ...style}} ref={ref} {...rest}>
      {children}
    </Component>
  )
});

export default TabPanels;
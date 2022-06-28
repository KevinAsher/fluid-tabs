import React from 'react';

// interface Props {
//   children: JSX.Element[];
//   component: React.ElementType;
//   rest: any;
//   index: number;
//   setIndex: (index: number) => void;
//   tabIndicatorRef: React.RefObject<HTMLElement>;
//   tabPanelsRef: React.RefObject<HTMLElement>;
//   preemptive: boolean;
// } 

interface Props {
  tabsRef: React.RefObject<HTMLElement[]>;
  children: JSX.Element[];
  component: React.ElementType;
  rest: any;
} 

const FluidTabList = React.forwardRef(({ tabsRef, children, component: Component, ...rest }: Props, ref) => {
  const addToRefs = React.useCallback((el: HTMLElement | null) => {
    if (el && !tabsRef.current?.includes(el)) {
      tabsRef.current?.push(el);
    }
  }, []);

  const childrenWithRef = React.Children.map(children, (child) => React.cloneElement(child, {ref: addToRefs}, undefined));

  return (
   <Component ref={ref} {...rest}>
    {childrenWithRef}
   </Component> 
  )
});

export default React.memo(FluidTabList);
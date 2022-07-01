import React from 'react';
import {type ReactiveTabIndicatorHookValues} from './useReactiveTabIndicator';

interface Props {
  tabsRef: ReactiveTabIndicatorHookValues["tabsRef"];
  children: JSX.Element[];
  component: React.ElementType;
  rest: any;
} 

const FluidTabs = React.forwardRef(({ tabsRef, children, component: Component, ...rest }: Props, ref) => {
  const addToRefs = React.useCallback((el: HTMLElement | null) => {
    if (el && !tabsRef.current!.nodes.includes(el)) {
      tabsRef.current!.nodes.push(el);
    }
  }, []);

  const childrenWithRef = React.Children.map(children, (child, index) => {
    return React.cloneElement(child, {ref: addToRefs}, undefined);
  });

  // Latest ref pattern - keep child props in sync with ref data
  React.useLayoutEffect(() => {
    React.Children.map(children, (child, index) => {
      tabsRef.current!.valueToIndex.set(child.props.value ?? index, index);
    });
  });

  return (
   <Component ref={ref} {...rest}>
    {childrenWithRef}
   </Component> 
  )
});

export default React.memo(FluidTabs);
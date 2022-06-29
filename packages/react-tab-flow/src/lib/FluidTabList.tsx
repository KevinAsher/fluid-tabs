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

interface TabsRef {
  nodes: HTMLElement[],
  valueToIndex: Map<string, number>
};

interface Props {
  tabsRef: React.RefObject<TabsRef>;
  children: JSX.Element[];
  component: React.ElementType;
  rest: any;
} 

const FluidTabList = React.forwardRef(({ tabsRef, children, component: Component, ...rest }: Props, ref) => {
  const addToRefs = React.useCallback((el: HTMLElement | null) => {
    if (el && !tabsRef.current!.nodes.includes(el)) {
      tabsRef.current!.nodes.push(el);
    }
  }, []);

  const childrenWithRef = React.Children.map(children, (child, index) => {
    return React.cloneElement(child, {ref: addToRefs}, undefined);
  });

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

export default React.memo(FluidTabList);
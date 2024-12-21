import React from "react";
import { type ReactiveTabIndicatorHookValues } from "./useReactiveTabIndicator";

interface Props {
  tabsRef: ReactiveTabIndicatorHookValues<HTMLElement>["tabsRef"];
  children: JSX.Element[];
  component: React.ElementType;
}

const FluidTabs = React.forwardRef((props: Props, ref) => {
  const { tabsRef, children, component: Component, ...rest } = props;
  // TODO: refactor this to a better ref callback.
  // For a good example using ref callback (see Deep Dive section):
  // https://beta.reactjs.org/learn/manipulating-the-dom-with-refs#example-scrolling-to-an-element
  const addToRefs = React.useCallback((el: HTMLElement | null) => {
    if (el && !tabsRef.current!.nodes.includes(el)) {
      tabsRef.current!.nodes.push(el);
    }
  }, []);

  const childrenWithRef = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) {
      return child;
    }
    return React.cloneElement(child, { ref: addToRefs });
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
  );
});

export default React.memo(FluidTabs);

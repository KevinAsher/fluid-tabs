import React, { useState, useRef, useEffect } from "react";
import TabIndicatorManager, {
  FluidTabsManagerConstructorParams,
} from "./TabIndicatorManager";
import useRefCallback from "./useRefCallback";
import FluidTabsManager from "./FluidTabsManager";

// Simple fallback for React versions before 18
const startTransition = React.startTransition || ((cb) => cb());

export type ReactiveTabIndicatorHookProps = {
  /**
   * The scroll container element of the tab panel list.
   */
  tabPanels: HTMLElement | null;
} & Pick<
  FluidTabsManagerConstructorParams,
  "switchThreshold" | "animateScrollToOptions" | "value" | "onChange"
>;

interface TabsRef<T> {
  nodes: T[];
  valueToIndex: Map<any, number>;
}

export interface ReactiveTabIndicatorHookValues<I, T = I> {
  /**
   * Required CSS styles for the tab indicator element.
   */
  tabIndicatorStyle: React.CSSProperties;

  /**
   * A ref to the tab indicator element.
   */
  tabIndicatorRef: React.RefCallback<HTMLElement>;

  /**
   * A special ref useed as an instance variable required to get the tab elements,
   * indexes and values.
   */
  tabsRef: React.RefObject<TabsRef<T>>;
}

const initialTabIndicatorStyle: React.CSSProperties = {
  left: 0,
  transition: "none",
  transformOrigin: "left 50% 0",
  willChange: "transform, width",
};

export default function useReactiveTabIndicator<T extends HTMLElement>({
  tabPanels,
  value,
  onChange,
  switchThreshold,
  animateScrollToOptions,
}: ReactiveTabIndicatorHookProps): ReactiveTabIndicatorHookValues<T> {
  const [tabIndicatorStyle, setTabIndicatorStyle] =
    useState<React.CSSProperties>(initialTabIndicatorStyle);
  const [tabIndicator, tabIndicatorRef] = useRefCallback();
  const tabsRef = useRef({
    nodes: [] as T[],
    valueToIndex: new Map<any, number>(),
  });
  const tabIndicatorManagerRef = useRef<FluidTabsManager | null>(null);

  useEffect(() => {
    if (!tabIndicator || !tabPanels || !tabsRef.current) return;

    const syncTabIndicatorWidth = () => {
      setTabIndicatorStyle((style: React.CSSProperties) => ({
        ...style,
        width: tabIndicatorManagerRef.current?.getCurrentTab().clientWidth,
      }));
    };

    tabIndicatorManagerRef.current = new FluidTabsManager({
      value,
      switchThreshold,
      animateScrollToOptions,
      tabIndicator,
      tabPanels,
      tabs: tabsRef.current.nodes,
      valueToIndex: tabsRef.current.valueToIndex,
      changeActiveTabCallback(value) {
        startTransition(() => {
          onChange(value);
        });
      },
    });

    syncTabIndicatorWidth();

    return () => tabIndicatorManagerRef.current?.cleanup();
  }, [tabPanels, tabIndicator, tabsRef]);

  useEffect(() => {
    tabIndicatorManagerRef.current?.changeActivePanel(value);
  }, [value]);

  return { tabIndicatorStyle, tabIndicatorRef, tabsRef };
}

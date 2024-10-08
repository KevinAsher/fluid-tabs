import React, { useState, useRef, useEffect, useMemo } from "react";
import { FluidTabsManager, Value } from "@fluid-tabs/core";
import useRefCallback from "./useRefCallback";

// Simple fallback for React versions before 18
const startTransition = React.startTransition || ((cb) => cb());

type FluidTabsManagerConstructorParams = ConstructorParameters<typeof FluidTabsManager>[0];

export type ReactiveTabIndicatorHookProps = {
  /**
   * The scroll container element of the tab panel list.
   */
  tabPanels: HTMLElement | null;

  onChange: FluidTabsManagerConstructorParams['changeActiveTabCallback'];
} & Pick<
  FluidTabsManagerConstructorParams,
  "switchThreshold" | "animateScrollToOptions" | "value" | "disableScrollTimeline"
>;

interface TabsRef<T> {
  nodes: T[];
  valueToIndex: FluidTabsManagerConstructorParams['valueToIndex'];
}

export interface ReactiveTabIndicatorHookValues<I, T = I> {
  tabIndicatorProps: {
    /**
     * Required CSS styles for the tab indicator element.
     */
    style: React.CSSProperties;

    /**
     * A ref to the tab indicator element.
     */
    ref: React.RefCallback<I>;

  }

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
  disableScrollTimeline,
}: ReactiveTabIndicatorHookProps): ReactiveTabIndicatorHookValues<T> {
  const [tabIndicatorStyle, setTabIndicatorStyle] =
    useState<React.CSSProperties>(initialTabIndicatorStyle);
  const [tabIndicator, tabIndicatorRef] = useRefCallback();
  const tabsRef = useRef({
    nodes: [] as T[],
    valueToIndex: new Map<Value, number>(),
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
      disableScrollTimeline,
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
    tabIndicatorManagerRef.current?.update(value);
  }, [value]);

  const tabIndicatorProps = useMemo(
    () => ({
      ref: tabIndicatorRef,
      style: tabIndicatorStyle,
    }),
    [tabIndicatorStyle],
  );

  return { tabIndicatorProps, tabsRef };
}

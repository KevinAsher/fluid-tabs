import React, { useState, useRef, useEffect } from "react";
import { type IUserOptions } from "animated-scroll-to";
import { flushSync } from "react-dom";
import TabIndicatorManager from "./TabIndicatorManager";
import useRefCallback from "./useRefCallback";

// Simple fallback for React versions before 18
let startTransition = React.startTransition || (cb => cb());

export interface ReactiveTabIndicatorHookProps {
  /**
   * The scroll container element of the tab panel list.
   */
  tabPanels: HTMLElement | null

  /**
   * State that controls the current active tab.
   */
  value: any, 

  /**
   * Setter to control the current active tab.
   */
  onChange: (val: any) => any, 

  /**
   * Preemptively changes the current active tab once we scrolled more then 50% of 
   * the other tab panel. The switch will only happen once the user releases the touch screen.
   * This feature really improves user experience since it delivers a native like tab UI. If not 
   * enabled (default), the user has to wait the snap scroll to complete, which can take a while
   * to update the current active tab.
   * 
   * This feature is recommended to use with for React 18+ concurrent mode to avoid jank, since 
   * it triggers a state update while scrolling.
   * @default false
   */
  preemptive?: boolean,
  
  /**
   * Disables vertical scrolling, this handles the case when a snap scroll is interrupted by a vertical
   * scroll, which keeps the UI in the middle of two tab panels.
   * @default false
   */
  lockScrollWhenSwiping?: boolean  

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions,
}

interface TabsRef<T> {
  nodes: T[],
  valueToIndex: Map<any, number>
};

export interface ReactiveTabIndicatorHookValues<I, T=I> {
  /**
   * Required CSS styles for the tab indicator element.
   */
  tabIndicatorStyle: React.CSSProperties, 

  /**
   * A ref to the tab indicator element.
   */
  tabIndicatorRef: React.RefCallback<HTMLElement>, 
  
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
  willChange: 'transform, width',
  // Make it initially invisible, and only made visible after the first scroll event
  // which happens on mount. This is used to avoid seeing the tab indicator
  // jump around when the component mounts.
  // visibility: 'hidden'
};

export default function useReactiveTabIndicator<T extends HTMLElement>
({ 
  tabPanels, 
  value, 
  onChange, 
  preemptive=false, 
  lockScrollWhenSwiping=false,
  animateScrollToOptions,
}: ReactiveTabIndicatorHookProps) : ReactiveTabIndicatorHookValues<T> {
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<React.CSSProperties>(initialTabIndicatorStyle);
  const [tabIndicator, tabIndicatorRef] = useRefCallback();
  const tabsRef = useRef({nodes: [] as T[], valueToIndex: new Map<any, number>()});
  const tabIndicatorManagerRef = useRef<TabIndicatorManager | null>(null);


  useEffect(() => {
    if (!tabIndicator || !tabPanels || !tabsRef.current) return;

    tabIndicatorManagerRef.current = new TabIndicatorManager({
      value,
      tabIndicator,
      tabPanels,
      tabs: tabsRef.current.nodes,
      valueToIndex: tabsRef.current.valueToIndex,
      tabChangeCallback(value) {
        startTransition(() => {
          onChange(value);
        })
      },
      resizeCallback() {
        // Force indicator state style update on the current frame.
        // React dosen't allow to run flushSync within a lifecycle callback, so we need to wrap within
        // a promise to have it called in the next microtask.

        // console.log('indicator style update');
        Promise.resolve().then(() => {
          flushSync(() => {
            setTabIndicatorStyle((style: React.CSSProperties) => ({
              ...style, 
              width: tabIndicatorManagerRef.current?.getCurrentTab().clientWidth,
              visibility: 'visible'
            }));
          })
        });

      }
  });

    return () => tabIndicatorManagerRef.current?.cleanup();
  }, [tabPanels, tabIndicator, tabsRef]);

  // Run the below effect on tab change.
  // If a diferent tab was clicked, we need to synchronize the scroll position.
  // Certain cases when updating the current tab (e.g., preemptive mode), we should'nt synchronize
  // the scroll position, so we keep it behind a flag, but also, re-enable the flag once we skiped it.
  // We can't depend on tabPanelsClientWidth here because we don't want to trigger a scrolling animation
  // on width size change.
  useEffect(() => {
    tabIndicatorManagerRef.current?.changeTab(value);
  }, [value]);

  return { tabIndicatorStyle, tabIndicatorRef, tabsRef };
}
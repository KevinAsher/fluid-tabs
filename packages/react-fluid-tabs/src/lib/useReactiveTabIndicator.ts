import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import animateScrollTo, { type IUserOptions } from "animated-scroll-to";
import { 
  calculateTransform, 
  Direction,
  getKeyByValue,
  useElementWidth,
  useIsTouchingElementRef,
  getWorkingTabs
} from './utils' ;
import { flushSync } from "react-dom";

// Simple fallback for React versions before 18
let startTransition = React.startTransition || (cb => cb());


// Depending on the device pixel ratio, a scroll container might not be able
// to scroll until it's full width as it should (might be a browser bug). Since the definition is unclear,
// we define an empirical limit ratio.
const SCROLL_RATIO_LIMIT = 0.001;

const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

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

type DOMElement<T extends HTMLElement> = T;

export interface ReactiveTabIndicatorHookValues<I, T=I> {
  /**
   * Required CSS styles for the tab indicator element.
   */
  tabIndicatorStyle: React.CSSProperties, 

  /**
   * A ref to the tab indicator element.
   */
  tabIndicatorRef: React.RefObject<I>, 
  
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
  visibility: 'hidden'
};

export default function useReactiveTabIndicator<I extends HTMLElement, T extends HTMLElement = I>
({ 
  tabPanels, 
  value, 
  onChange, 
  preemptive=false, 
  lockScrollWhenSwiping=false,
  animateScrollToOptions,
}: ReactiveTabIndicatorHookProps) : ReactiveTabIndicatorHookValues<I, T> {
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<React.CSSProperties>(initialTabIndicatorStyle);
  const previousRelativeScrollRef = useRef<number | null>(null);
  const previousTabRef = useRef<HTMLElement | null>(null);
  const canChangeTabRef = useRef<boolean>(true);
  const canAnimateScrollToPanel = useRef<boolean>(false);
  const tabPanelsClientWidth = useElementWidth(tabPanels);
  const isTouchingRef = useIsTouchingElementRef(tabPanels);
  const tabIndicatorRef = useRef<I>(null);
  const tabsRef = useRef({nodes: [] as T[], valueToIndex: new Map<any, number>()});
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    // Don't let animation play on mount.
    // Setting default value at ref initialization above is not enough since React 18.
    canAnimateScrollToPanel.current = false;
  }, []);

  // Latest ref pattern - we use it here to have latest value on the scroll listener
  // to avoid recreating the scroll listener on tab change.
  useLayoutEffect(() => {
    valueRef.current = value;
  });
  
  // Run the below effect on tab change.
  // If a diferent tab was clicked, we need to synchronize the scroll position.
  // Certain cases when updating the current tab (e.g., preemptive mode), we should'nt synchronize
  // the scroll position, so we keep it behind a flag, but also, re-enable the flag once we skiped it.
  // We can't depend on tabPanelsClientWidth here because we don't want to trigger a scrolling animation
  // on width size change.
  useEffect(() => {
    canChangeTabRef.current = true;

    if (!tabPanels) return;

    if (!canAnimateScrollToPanel.current) {
      canAnimateScrollToPanel.current = true;
      return;
    }
    
    /* Animate scrolling to the relevant tab panel */
    const index = tabsRef.current.valueToIndex.get(value)!; 
    canChangeTabRef.current = false;
    tabPanels.style.scrollSnapType = "none";

    animateScrollTo([index * tabPanels.getBoundingClientRect().width, 0], {
      minDuration: 500,
      maxDuration: 800,
      easing: easeInOutCubic,
      ...animateScrollToOptions,
      elementToScroll: tabPanels,
      cancelOnUserAction: false,
    }).then((hasScrolledToPosition) => {
      if (hasScrolledToPosition) {
        canChangeTabRef.current = true;
        
        tabPanels.style.scrollSnapType = "x mandatory";

        // On ios < 15, setting scroll-snap-type resets the scroll position
        // so we need to reajust it to where it was before.
        tabPanels.scrollLeft = index * tabPanels.getBoundingClientRect().width;
      }

    }).catch(() => {
        tabPanels.style.scrollSnapType = "x mandatory";
    });
  }, [value, tabPanels]);

  const onScroll = useCallback((e: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = e.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // We can't use tabPanelsClientWidth here because we might get an outdated width from a screen orietation change
    // which will cause a scroll before tabPanelsClientWidth gets a chance to update.
    const relativeScrollRaw = scrollLeft / tabPanels!.getBoundingClientRect().width;

    const closestIndexFromScrollPosition = Math.round(relativeScrollRaw);

    // Same as relativeScrollRaw, but with it's value snapped to the closest tab panel index when it's very close.
    const relativeScroll = Math.abs(closestIndexFromScrollPosition - relativeScrollRaw) < SCROLL_RATIO_LIMIT ? closestIndexFromScrollPosition : relativeScrollRaw;

    // Only initialize required ref values on initial scroll.
    if (previousRelativeScrollRef.current === null) {
      previousRelativeScrollRef.current = relativeScroll;
      previousTabRef.current = tabsRef.current.nodes[Math.trunc(relativeScroll)];
      return;
    }

    // skip if there wasn't a change on scroll
    if (relativeScroll === previousRelativeScrollRef.current) return;

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > tabsRef.current.nodes.length - 1) return;

    const direction = previousRelativeScrollRef.current <= relativeScroll ? Direction.RIGHT : Direction.LEFT;

    const destinationIndex = tabsRef.current.valueToIndex.get(valueRef.current);

    const isSnapped = relativeScroll % 1 === 0 && relativeScroll === destinationIndex;

    if (preemptive && !isSnapped && !isTouchingRef.current && closestIndexFromScrollPosition !== destinationIndex && canChangeTabRef.current) {
      startTransition(() => {
        onChange(getKeyByValue(tabsRef.current.valueToIndex, closestIndexFromScrollPosition));
        canAnimateScrollToPanel.current = false;
        canChangeTabRef.current = false;
      })
    }

    let {currentTab, nextTab} = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: tabsRef.current.nodes,
      previousTab: previousTabRef.current, 
      previousRelativeScroll: previousRelativeScrollRef.current,
    });

    const currentTabIndex = tabsRef.current.nodes.findIndex(tab => tab === currentTab);

    let { translateX, scaleX } = calculateTransform({
      currentTab, 
      nextTab, 
      direction, 
      relativeScroll, 
      currentTabIndex, 
      previousTab: previousTabRef.current,
      tabs: tabsRef.current.nodes,
    });

    requestAnimationFrame(() => {
      const scaleXCss = `scaleX(${scaleX})`;
      const translateXCss = `translateX(${translateX}px)`;

      if(tabIndicatorRef.current) tabIndicatorRef.current.style.transform = `${translateXCss} ${scaleXCss}`;
      if (lockScrollWhenSwiping && tabPanels) tabPanels.style.touchAction = currentTabIndex !== destinationIndex ? 'pan-x' : 'auto';
    });

    // set previous relative scroll for the next scroll event
    previousRelativeScrollRef.current = relativeScroll;

    // currentTab will be previousTab until there is a tab switch.
    if (previousTabRef.current === currentTab) return;
   
    // set previous tab for next scroll event
    previousTabRef.current = currentTab;

    requestAnimationFrame(() => {
      /* 
        Update the tab indicator width outside React for performance reasons. This will
        cause this element to be out of sync between react and the dom but it's a temporary out of sync.
        This is only for when the indicator is passing by other tabs until it reaches it's
        destination tab. Once it reaches it, we re-sync the elements width with it's actual state.
      */
      if(tabIndicatorRef.current) tabIndicatorRef.current.style.width = currentTab.clientWidth + 'px';

      if (lockScrollWhenSwiping && tabPanels) tabPanels.style.touchAction = 'auto';
    });

    if (destinationIndex === currentTabIndex) {
      // we have reached our destination tab, resync width as previously mentioned.
      startTransition(() => {
        setTabIndicatorStyle((style: React.CSSProperties) => ({
          ...style, 
          width: currentTab.clientWidth, 
        }));
      })
    } else if (canChangeTabRef.current) {
      canAnimateScrollToPanel.current = false;
      startTransition(() => {
        onChange(getKeyByValue(tabsRef.current.valueToIndex, currentTabIndex));
        setTabIndicatorStyle((style: React.CSSProperties) => ({...style, width: currentTab.clientWidth}));
      })
     }
  }, [lockScrollWhenSwiping, preemptive, tabPanels]);
 
  

  useEffect(() => {
    tabPanels?.addEventListener("scroll", onScroll);

    return () => {
      tabPanels?.removeEventListener("scroll", onScroll);
    };
  }, [onScroll, tabPanels]);


  // Effect runs when the scroll container width changes, e.g. mobile orientation changed.
  // This effect will also run once after mount for initial scroll synchronization.
  useEffect(() => {
    if (!tabPanels || !tabIndicatorRef.current) return;

    const index = tabsRef.current.valueToIndex.get(valueRef.current)!;
    const currentTab = tabsRef.current.nodes[index];

    tabIndicatorRef.current.style.transform = `translateX(${currentTab.offsetLeft}px) scaleX(1)`;

    // Force indicator state style update on the current frame.
    // React dosen't allow to run flushSync within a lifecycle callback, so we need to wrap within
    // a promise to have it called in the next microtask.
    Promise.resolve().then(() => {
      flushSync(() => {
        setTabIndicatorStyle((style: React.CSSProperties) => ({
          ...style, 
          width: currentTab.clientWidth,
          visibility: 'visible'
        }));
      })
    });

    tabPanels.scrollLeft = index * tabPanelsClientWidth;

    if (index === 0) {
      // We need to force a scroll event here since setting scrollLeft
      // to a number that dosen't cause scroll won't trigger are
      // scroll listener. 
      tabPanels.dispatchEvent(new CustomEvent('scroll'));
    }
  }, [tabPanelsClientWidth, tabPanels, tabIndicatorRef]);


  return { tabIndicatorStyle, tabIndicatorRef, tabsRef };
}
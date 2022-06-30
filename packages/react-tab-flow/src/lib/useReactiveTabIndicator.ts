import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import animateScrollTo from "animated-scroll-to";
import { calculateTransform, Direction } from './utils/transform' ;
import { getKeyByValue } from './utils/common';
import useElementWidth from './hooks/useElementWidth';
import useIsTouchingRef from './hooks/useIsTouchingRef';

// Simple fallback for React versions before 18
let startTransition = React.startTransition || (cb => cb());

interface GetWorkingTabsProps {
  previousTab: HTMLElement | null
  direction: Direction
  relativeScroll: number
  previousRelativeScroll: number
  tabs: HTMLElement[]
}

interface WorkingTabs {
  currentTab: HTMLElement
  nextTab: HTMLElement
}

export function getWorkingTabs({
  previousTab, 
  tabs, 
  direction, 
  relativeScroll, 
  previousRelativeScroll
}: GetWorkingTabsProps): WorkingTabs {
  let currentTab = previousTab;

  let scrollTabIndex = Math.trunc(relativeScroll);
  let previousScrollTabIndex = Math.trunc(previousRelativeScroll);

  if (relativeScroll === previousRelativeScroll) {
    currentTab = tabs[scrollTabIndex];
  } else if (direction === Direction.RIGHT && scrollTabIndex > previousScrollTabIndex) {
    currentTab = tabs[scrollTabIndex];
  } else if (direction === Direction.LEFT && (scrollTabIndex < previousScrollTabIndex || relativeScroll % 1 === 0)) {
    currentTab = tabs[previousScrollTabIndex];
  }

  let nextTab = tabs[direction === Direction.RIGHT ? Math.ceil(relativeScroll) : Math.floor(relativeScroll)];
  return { currentTab: currentTab!, nextTab }
}


// Depending on the device pixel ratio, a scroll container might not be able
// to scroll until it's full width as it should (might be a browser bug). Since the definition is unclear,
// we define an empirical limit ratio.
const SCROLL_RATIO_LIMIT = 0.001;

const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export interface ReactiveTabIndicatorHookProps {
  /**
   * A ref to the scroll container element of the tab panels.
   */
  tabPanelsRef: React.RefObject<HTMLElement>

  /**
   * State that controls the current active tab.
   */
  value: any, 

  /**
   * Setter to control the current active tab.
   */
  setValue: (val: any) => any, 

  /**
   * Preemptively changes the current active tab once we scrolled more then 50% of 
   * the other tab panel. The switch will only happen once the user releases the touch screen.
   * This feature really improves user experience since it delivers a native like tab UI. If not 
   * enabled (default), the user has to wait the snap scroll to complete, which can take a while
   * to update the current active tab.
   * 
   * This feature is recommended to use with for React 18+ concurrent mode to avoid jank, since 
   * it triggers a state update while scrolling.
   */
  preemptive: boolean,
  
  /**
   * Disables vertical scrolling, this handles the case when a snap scroll is interrupted by a vertical
   * scroll, which keeps the UI in the middle of two tab panels.
   */
  lockScrollWhenSwiping: boolean  
}

interface TabsRef {
  nodes: HTMLElement[],
  valueToIndex: Map<string, number>
};

export interface ReactiveTabIndicatorHookValues {
  /**
   * Required CSS styles for the tab indicator element.
   */
  tabIndicatorStyle: React.CSSProperties, 

  /**
   * A ref to the tab indicator element.
   */
  tabIndicatorRef: React.RefObject<HTMLElement>, 
  
  /**
   * A special ref useed as an instance variable required to get the tab elements,
   * indexes and values.
   */
  tabsRef: React.RefObject<TabsRef>;
}

const initialTabIndicatorStyle = {
  left: 0,
  transition: "none",
  transformOrigin: "left 50% 0",
  willChange: 'transform, width',
};

export default function useReactiveTabIndicator({ 
  tabPanelsRef, 
  value, 
  setValue, 
  preemptive=false, 
  lockScrollWhenSwiping=false  
}: ReactiveTabIndicatorHookProps) : ReactiveTabIndicatorHookValues {
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState<React.CSSProperties>(initialTabIndicatorStyle);
  const previousRelativeScrollRef = useRef(0);
  const previousTabRef = useRef<HTMLElement | null>(null);
  const shouldSkipSettingIndexRef = useRef<boolean>(false);
  const shouldSkipForcedScrollRef = useRef<boolean>(false);
  const tabPanelsClientWidth = useElementWidth(tabPanelsRef);
  const isTouchingRef = useIsTouchingRef(tabPanelsRef);
  const tabIndicatorRef = useRef<HTMLElement | null>(null);
  const tabsRef = useRef({nodes: [], valueToIndex: new Map()});
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    // Skip forced scroll on mount
    shouldSkipForcedScrollRef.current = true;
  }, []);

  // Latest ref pattern - we use it here to have latest value on the scroll listener
  // to avoid recreating the scroll listener on tab change.
  useLayoutEffect(() => {
    valueRef.current = value;
  });
  
  // Run the below effect on index change.
  // If a tab was clicked (index changed), we need to synchronize the scroll position.
  // Certain cases when updating the current index (e.g., preemptive mode), we should'nt synchronize
  // the scroll position, so we keep it behind a flag, but also, re-enable the flag once we skiped it.
  useEffect(() => {
    shouldSkipSettingIndexRef.current = false;

    const tabPanelsEl = tabPanelsRef.current!;

    if (!shouldSkipForcedScrollRef.current) {
      const index = tabsRef.current.valueToIndex.get(value); 
      shouldSkipSettingIndexRef.current = true;
      tabPanelsEl.style.scrollSnapType = "none";
      animateScrollTo([index * tabPanelsEl.getBoundingClientRect().width, 0], {
        elementToScroll: tabPanelsEl,
        minDuration: 500,
        cancelOnUserAction: false,
        maxDuration: 1000,
        easing: easeInOutCubic,
      })
        .then((hasScrolledToPosition) => {
          shouldSkipSettingIndexRef.current = false;
          if (hasScrolledToPosition) {
            tabPanelsEl.style.scrollSnapType = "x mandatory";

            // On ios < 15, setting scroll-snap-type resets the scroll position
            // so we need to reajust it to where it was before.
            tabPanelsEl.scrollTo(
              index * tabPanelsEl.clientWidth,
              0
            );
          }

        }).catch(() => {
            tabPanelsEl.style.scrollSnapType = "x mandatory";
        });

    } else {
      shouldSkipForcedScrollRef.current = false;
    }
  }, [value]);

  const onScroll = useCallback((e: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = e.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // We can't use tabPanelsClientWidth here because we might get an outdated width from a screen orietation change
    // which will cause a scroll before tabPanelsClientWidth gets a chance to update.
    const relativeScrollRaw = scrollLeft / tabPanelsRef.current!.getBoundingClientRect().width;

    const closestTabPanelIndex = Math.round(relativeScrollRaw);

    // Same as relativeScrollRaw, but with it's value snapped to the closest tab panel index when it's very close.
    const relativeScroll = Math.abs(closestTabPanelIndex - relativeScrollRaw) < SCROLL_RATIO_LIMIT ? closestTabPanelIndex : relativeScrollRaw;

    const direction = previousRelativeScrollRef.current <= relativeScroll ? Direction.RIGHT : Direction.LEFT;

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > tabsRef.current.nodes.length - 1) return;

    const index = tabsRef.current.valueToIndex.get(valueRef.current);

    if (preemptive && !isTouchingRef.current && closestTabPanelIndex !== index && !shouldSkipSettingIndexRef.current) {
      startTransition(() => {
        setValue(getKeyByValue(tabsRef.current.valueToIndex, closestTabPanelIndex));
        shouldSkipForcedScrollRef.current = true;
        shouldSkipSettingIndexRef.current = true;
      })
    }

    let {currentTab, nextTab} = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: tabsRef.current.nodes,
      previousTab: previousTabRef.current, 
      previousRelativeScroll: previousRelativeScrollRef.current,
    })

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

      tabIndicatorRef.current!.style.transform = `${translateXCss} ${scaleXCss}`;
      if (lockScrollWhenSwiping) tabPanelsRef.current!.style.touchAction = relativeScroll !== index ? 'pan-x' : 'auto';
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
      tabIndicatorRef.current!.style.width = currentTab.clientWidth + 'px';
      if (lockScrollWhenSwiping) tabPanelsRef.current!.style.touchAction = 'auto';
    })

    if (index === currentTabIndex) {
      // we have reached our destination tab, resync width as previously mentioned.
      startTransition(() => {
        setTabIndicatorStyle((style: React.CSSProperties) => ({...style, width: currentTab.clientWidth}));
      })
    } else if (!shouldSkipSettingIndexRef.current) {
      shouldSkipForcedScrollRef.current = true;
      
      startTransition(() => {
        setValue(getKeyByValue(tabsRef.current.valueToIndex, currentTabIndex));
        setTabIndicatorStyle((style: React.CSSProperties) => ({...style, width: currentTab.clientWidth}));
      })
     }
  }, [lockScrollWhenSwiping, preemptive]);
 
  

  useEffect(() => {
    tabPanelsRef.current?.addEventListener("scroll", onScroll);

    return () => {
      tabPanelsRef.current?.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  // Effect runs when the scroll container width changes, e.g. mobile orientation changed.
  // This effect will also run once after mount for initial scroll synchronization.
  useEffect(() => {
    if (tabPanelsRef.current) {
      const index = tabsRef.current.valueToIndex.get(valueRef.current);

      requestAnimationFrame(() => {
        // This will trigger a scroll event, which will be handled by our scroll handler.
        // It's wrapped within a raf because sometimes Safari randomly just refuses to
        // to generate the scroll event after the initial page load, maybe a timing/rendering issue,
        // which happens sporadically.
        tabPanelsRef.current!.scrollLeft = index * tabPanelsClientWidth!;
      })

      if (index === 0) {
        // We need to force a scroll event here since setting scrollLeft
        // to a number that dosen't cause scroll won't trigger are
        // scroll listener. 
        tabPanelsRef.current.dispatchEvent(new CustomEvent('scroll'));
      }
    }
  }, [tabPanelsClientWidth]);


  return { tabIndicatorStyle, tabIndicatorRef, tabsRef };
}
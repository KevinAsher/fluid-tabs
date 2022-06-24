// @ts-nocheck
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";

let useTransition;

if (React.useTransition) {
  useTransition = React.useTransition;
} else {
  useTransition = () => [false, (callback) => callback()];
}

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

const RIGHT = "RIGHT";
const LEFT = "LEFT";

function calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress) {
  let scaleX = 1;
  const tabWidthRatio = nextTabWidth / currentTabWidth;

  if (tabWidthRatio < 1) {
    scaleX = 1 - currentTabScrollProgress * (1 - tabWidthRatio);
  } else {
    scaleX = 1 + currentTabScrollProgress * (tabWidthRatio - 1);
  }

  return scaleX;
}

function calculateTransform({currentTab, previousTab, nextTab, direction, relativeScroll, currentTabIndex, tabRefs}) {
    let currentTabScrollProgress;
    let scaleX;
    let translateX = 0;
    let nextTabWidth;
    let currentTabWidth = currentTab.clientWidth;
    let offsetLeft = currentTab.offsetLeft;

    if (currentTab !== nextTab || previousTab !== currentTab) {
      currentTabScrollProgress = direction === RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);

      nextTabWidth = nextTab.clientWidth;

      if (direction === RIGHT) {
        translateX = offsetLeft + (relativeScroll % 1) * currentTabWidth;
      } else {
        translateX = offsetLeft - (1 - (relativeScroll % 1 || 1)) * nextTabWidth;
      }
    } else if (relativeScroll >= 0 && relativeScroll <= tabRefs.current.length - 1) {
      currentTabScrollProgress = direction === RIGHT ? 1 - (relativeScroll % 1 || 1) : relativeScroll % 1;

      let wasGonnaBeNextTabIndex;
      let wasGonnaBeNextTab;
      if (direction === LEFT) {
        wasGonnaBeNextTabIndex = clamp(currentTabIndex + 1, 0, tabRefs.current.length-1);
      } else {
        wasGonnaBeNextTabIndex = clamp(currentTabIndex - 1, 0, tabRefs.current.length-1);
      }

      wasGonnaBeNextTab = tabRefs.current[wasGonnaBeNextTabIndex];
      nextTabWidth = wasGonnaBeNextTab.clientWidth;

      if (direction === RIGHT) {
        translateX = offsetLeft - currentTabScrollProgress * nextTabWidth;
      } else {
        translateX = offsetLeft + currentTabScrollProgress * currentTabWidth;
      }
    }

    scaleX = calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress);

    return { scaleX, translateX };
}

/*
  Only read the client width of the tab panels on initialization and
  width update (most likely screen orientation change).
*/
function useTabPanelsClientWidth(tabPanelsRef) {
  const [tabPanelsClientWidth, setTabPanelsClientWidth] = useState();
  const { width } = useWindowSize();

  useEffect(() => {
    setTabPanelsClientWidth(tabPanelsRef.current.getBoundingClientRect().width);
  }, [width]);

  return tabPanelsClientWidth;
}

function useIsTouchingRef(ref) {
  const isTouchingRef = useRef(false);

  React.useEffect(() => {

    function setTouchingFlag() {
      isTouchingRef.current = true;
    }

    function unsetTouchingFlag() {
      isTouchingRef.current = false;
    }

    ref.current?.addEventListener('touchstart', setTouchingFlag, {passive: true});
    ref.current?.addEventListener('touchend', unsetTouchingFlag, {passive: true});
    return () => {
      ref.current?.removeEventListener('touchstart', setTouchingFlag);
      ref.current?.removeEventListener('touchend', unsetTouchingFlag);
    }
  }, []);

  return isTouchingRef;
}

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
} 

function getWorkingTabs({previousTab, previousIndex, tabRefs, direction, relativeScroll, previousRelativeScroll}) {
  let currentTab = tabRefs.current[previousIndex];

  if (previousTab === null) {
    previousTab = currentTab;
  }

  if (direction === RIGHT) {
    if (Math.trunc(relativeScroll) > Math.trunc(previousRelativeScroll)) {
      currentTab = tabRefs.current[Math.trunc(relativeScroll)];
    } else {
      currentTab = previousTab;
    }
  } else {
    if (
      Math.trunc(relativeScroll) < Math.trunc(previousRelativeScroll) ||
      relativeScroll % 1 === 0
    ) {
      currentTab = tabRefs.current[Math.trunc(previousRelativeScroll)];
    } else {
      currentTab = previousTab;
    }
  }

  let nextTabIndex;
  
  if (direction === RIGHT) {
    nextTabIndex = Math.ceil(relativeScroll);
  } else {
    nextTabIndex = Math.floor(relativeScroll);
  }

  let nextTab = tabRefs.current[nextTabIndex];

  return { previousTab, currentTab, nextTab, }
}

export default function useReactiveTabIndicator({ tabPanelsRef, index, setIndex, preemptive=false, lockScrollWhenSwiping=false  }) {
  const [tabIndicatorStyles, setTabIndicatorStyles] = useState(null);
  const previousRelativeScrollRef = useRef(0);
  const indicatorTranslateXRef = useRef(0);
  const indicatorScaleXRef = useRef(1);
  const previousTabRef = useRef(null);
  const previousIndex = usePrevious(index);
  const shouldSkipSettingIndexRef = useRef(false);
  const shouldSkipForcedScrollRef = useRef(false);
  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);
  const isTouchingRef = useIsTouchingRef(tabPanelsRef);
  const tabIndicatorRef = useRef(null);
  const tabRefs = useRef([]);
  const indexRef = useRef(index);

  useLayoutEffect(() => {
    setTabIndicatorStyles({width: tabRefs.current[index].clientWidth});
    shouldSkipForcedScrollRef.current = true;
  }, [tabPanelsClientWidth]);

  useLayoutEffect(() => {
    if (tabPanelsRef.current) {
      tabPanelsRef.current.scrollLeft = index * tabPanelsClientWidth;
    }
  }, [tabPanelsClientWidth, tabIndicatorRef.current])

  useEffect(() => {

    if (!shouldSkipForcedScrollRef.current) {
      shouldSkipSettingIndexRef.current = true;
      tabPanelsRef.current.style = "scroll-snap-type: none";
      animateScrollTo([index * tabPanelsRef.current.clientWidth, 0], {
        elementToScroll: tabPanelsRef.current,
        minDuration: 500,
        cancelOnUserAction: false,
        maxDuration: 1000,

        easing: (t) => {
          return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }
      })
        .then((hasScrolledToPosition) => {
          shouldSkipSettingIndexRef.current = false;
          if (hasScrolledToPosition) {
            tabPanelsRef.current.style = "scroll-snap-type: x mandatory";


            // On ios < 15, setting scroll-snap-type resets the scroll position
            // so we need to reajust it to where it was before.
            tabPanelsRef.current.scrollTo(
              index * tabPanelsRef.current.clientWidth,
              0
            );
          }

        }).catch(() => {
            tabPanelsRef.current.style = "scroll-snap-type: x mandatory";
        });

    } else {
      shouldSkipForcedScrollRef.current = false;
    }
  }, [index, tabPanelsClientWidth]);

  const [_, startTransition] = useTransition();

  const onScroll = React.useCallback((e) => {
    const scrollLeft = e.target.scrollLeft;
    const relativeScrollRaw = scrollLeft / tabPanelsClientWidth;
    const index = indexRef.current;

    const relativeScroll = Math.abs(Math.round(relativeScrollRaw) - relativeScrollRaw) < 0.001 ? Math.round(relativeScrollRaw) : relativeScrollRaw;
    const direction = previousRelativeScrollRef.current <= relativeScroll ? RIGHT : LEFT;

    if (relativeScroll < 0 || relativeScroll > tabRefs.current.length - 1) return;

    /*
      currentTab floats from previousTab to currentTab when the previousTab and nextTab are adjacent,
      also, currentTab has the value of previousTab until the last scroll callback, in which it becomes 
      next tab. Otherwise, currentTab can have an intermediate tab value, but only for a single scroll callback, 
      because the previous tab will get the value of the intermediate tab in the next scroll callback.
    */
    
    let {previousTab, currentTab, nextTab} = getWorkingTabs({
      previousTab: previousTabRef.current,
      previousIndex,  
      tabRefs,
      direction,
      relativeScroll,
      previousRelativeScroll: previousRelativeScrollRef.current,
    });

    previousTabRef.current = previousTab;

    if (preemptive && !isTouchingRef.current) {
      if (Math.round(relativeScrollRaw) !== index && !shouldSkipSettingIndexRef.current) {
        startTransition(() => {
          setIndex(Math.round(relativeScrollRaw));
          shouldSkipForcedScrollRef.current = true;
        })
      }
    }
    
    const currentTabIndex = tabRefs.current.findIndex(tab => tab === currentTab);

    let { translateX, scaleX } = calculateTransform({
      currentTab, 
      previousTab, 
      nextTab, 
      direction, 
      relativeScroll, 
      currentTabIndex, 
      tabRefs,
    });

    indicatorScaleXRef.current = scaleX;
    indicatorTranslateXRef.current = translateX;
    
    requestAnimationFrame(() => {
      const scaleXCss = `scaleX(${indicatorScaleXRef.current})`;
      const translateXCss = `translateX(${indicatorTranslateXRef.current}px)`;

      tabIndicatorRef.current.style.transform = `${translateXCss} ${scaleXCss}`;
      if (lockScrollWhenSwiping) tabPanelsRef.current.style.touchAction = relativeScroll !== index ? 'pan-x' : 'auto';
    });

    previousRelativeScrollRef.current = relativeScroll;

    if (previousTab === currentTab) return;
    previousTabRef.current = currentTab;

    /* 
      Update the tab indicator width outside React for performance reasons. This will
      cause this element to be out of sync between react and the dom but it's a temporary out of sync.
      This is only for when the indicator is passing by other elements until it reaches it's
      destination tab. Once it reaches it, we re-sync the elements width with it's actual state.
    */

    requestAnimationFrame(() => {
      tabIndicatorRef.current.style.width = currentTab.clientWidth + 'px';
      if (lockScrollWhenSwiping) tabPanelsRef.current.style.touchAction = 'auto';
    })

    if (index === currentTabIndex) {
      startTransition(() => {
        setTabIndicatorStyles({width: currentTab.clientWidth})
      })
    } else if (!shouldSkipSettingIndexRef.current) {
      shouldSkipForcedScrollRef.current = true;
      startTransition(() => {
        setIndex(currentTabIndex);
        setTabIndicatorStyles({width: currentTab.clientWidth})
      })
    }
  }, [tabPanelsClientWidth]);
 
  
  // Latest ref pattern - avoid recreating events on index change - we don't 
  // want to reattach scroll event listeners on preemptive mode, which might cause us
  // to lose a frame? (needs testing).
  React.useLayoutEffect(() => {
    indexRef.current = index;
  });

  React.useLayoutEffect(() => {
    tabPanelsRef.current?.addEventListener("scroll", onScroll);

    return () => {
      tabPanelsRef.current?.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);


  return { tabIndicatorStyles, tabIndicatorRef, tabPanelsRef, tabRefs };
}
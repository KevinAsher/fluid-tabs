// @ts-nocheck
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";

function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


const RIGHT = "RIGHT";
const LEFT = "LEFT";

function calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress) {
  let scaleX;
  const tabWidthRatio = nextTabWidth / currentTabWidth;

  if (tabWidthRatio < 1) {
    scaleX = 1 - currentTabScrollProgress * (1 - tabWidthRatio);
  } else {
    scaleX = 1 + currentTabScrollProgress * (tabWidthRatio - 1);
  }

  return scaleX;
}

function calculateTransform({currentTab, previousTab, nextTab, direction, relativeScroll, scrollLeftRef, currentTabIndex, tabRefs}) {
    let currentTabScrollProgress;
    let scaleX;
    let translateX;
    let nextTabWidth;
    let currentTabWidth = currentTab.clientWidth;

    if (currentTab !== nextTab || previousTab !== currentTab) {
      currentTabScrollProgress = direction === RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);

      nextTabWidth = nextTab.clientWidth;

      scaleX = calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress);

      if (direction === RIGHT) {
        translateX = scrollLeftRef.current + (relativeScroll % 1) * currentTabWidth;
      } else {
        translateX = scrollLeftRef.current - (1 - (relativeScroll % 1 || 1)) * nextTabWidth;
      }
    } else {
      currentTabScrollProgress = direction === RIGHT ? 1 - (relativeScroll % 1 || 1) : relativeScroll % 1;

      let wasGonnaBeNextTabIndex;
      let wasGonnaBeNextTab;
      if (direction === LEFT) {
        wasGonnaBeNextTabIndex = currentTabIndex + 1;
        wasGonnaBeNextTab = tabRefs.current[wasGonnaBeNextTabIndex];
      } else {
        wasGonnaBeNextTabIndex = currentTabIndex - 1;
        wasGonnaBeNextTab = tabRefs.current[wasGonnaBeNextTabIndex];
      }
      nextTabWidth = wasGonnaBeNextTab.clientWidth;

      scaleX = calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress);

      if (direction === RIGHT) {
        translateX = scrollLeftRef.current - currentTabScrollProgress * nextTabWidth;
      } else {
        translateX = scrollLeftRef.current + currentTabScrollProgress * currentTabWidth;
      }
    }

    return { scaleX, translateX };
}

/*
  Only read the client width of the tab panels on initialization and
  width update (most likely screen orientation change).
*/
function useTabPanelsClientWidth(tabPanelsRef) {
  const [tabPanelsClientWidth, setTabPanelsClientWidth] = useState();
  const { width } = useWindowSize();

  useLayoutEffect(() => {
    setTabPanelsClientWidth(tabPanelsRef.current.clientWidth);
  }, [width]);

  return tabPanelsClientWidth;
}

function getWorkingTabs({previousTabRef, previousIndex, tabRefs, direction, relativeScroll, previousRelativeScrollRef}) {
  
    let currentTab = null;
    if (previousTabRef.current === null) {
      currentTab = tabRefs.current[previousIndex || 0];
      previousTabRef.current = currentTab;
    }

    if (direction === RIGHT) {
      /**
       *   Scroll Direction -->
       *              |----T1----|----T2----|----T3----|
       *                        ----------
       *                        ^ ----------
       *                        ^ ^
       *                        ^ ^
       *   _____________________^ ^________________________
       *   Previous Relative scroll    Current Relative scroll
       *
       *   Valid Previous currentTab:
       *   - T1 (Scrolling left to right)
       *   - T2 (Was already on T2, scrolled left a bit, then scrolled right again)
       */

      if (Math.trunc(relativeScroll) > Math.trunc(previousRelativeScrollRef.current)) {
        currentTab = tabRefs.current[Math.trunc(relativeScroll)];
      } else {
        /**
         *   Scroll Direction -->
         *           |----T1----|----T2----|----T3----|
         *                        ----------
         *                        ^ ----------
         *                        ^ ^
         *                        ^ ^
         *   _____________________^ ^________________________
         *   Previous Relative scroll    Current Relative scroll
         *
         *   Valid Previous currentTab:
         *   - T2 (Already on T2 and scrolling left to right)
         *   - T3 (scrolling left to right from T3, and then right to lef)
         */

        // don't do anything on this case because is not on a switching point
        currentTab = previousTabRef.current;
      }
    } else if (direction === LEFT) {
      // being very explicit for readability

      /**
       *   Scroll Direction <--
       *                 |----T1----|----T2----|----T3----|
       *                           ----------
       *                           ^ ----------
       *                           ^ ^
       *                           ^ ^
       *   ________________________^ ^________________________
       *   Current Relative scroll    Previous Relative scroll
       *
       *   Valid Previous currentTab:
       *   - T2 (was already on T2 scrolling right to left)
       *   - T3 (scrolling right to left)
       */

      if (
        Math.trunc(relativeScroll) < Math.trunc(previousRelativeScrollRef.current) ||
        relativeScroll % 1 === 0
      ) {
        currentTab = tabRefs.current[Math.trunc(previousRelativeScrollRef.current)];
      } else {
        /**
         *   Scroll Direction <--
         *              |----T1----|----T2----|----T3----|
         *                           ----------
         *                           ^ ----------
         *                           ^ ^
         *   ________________________^ ^________________________
         *   Current Relative scroll    Previous Relative scroll
         *
         *   Valid Previous currentTab:
         *   - T2 (was already on T2 scrolling left to right, and then right to left)
         *   - T3 (scrolling left to right)
         */

        // don't do anything on this case because is not on a switching point
        currentTab = previousTabRef.current;
      }
    }


    let nextTab =
      direction === RIGHT
        ? tabRefs.current[Math.ceil(relativeScroll)]
        : tabRefs.current[Math.floor(relativeScroll)];

    if (!currentTab) {
      throw new Error("Unhandled case for currentTab!");
    }
  return { previousTab: previousTabRef.current, currentTab, nextTab}
}

export default function useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef }) {
  const [tabIndicatorWidth, setTabIndicatorWidth] = useState(null);
  const previousRelativeScrollRef = React.useRef(0);
  const indicatorTranslateXRef = React.useRef(0);
  const indicatorScaleXRef = React.useRef(1);
  const [index, setIndex] = useState(0);
  const previousTabRef = React.useRef(null);
  const previousIndex = usePrevious(index);
  const scrollLeftRef = React.useRef(0);
  const skipSettingIndexRef = React.useRef(false);
  const skipForcedScrollRef = React.useRef(false);
  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);
  const tabOffsetLeftRefs = React.useRef();

  React.useLayoutEffect(() => {
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    skipForcedScrollRef.current = true;
    tabOffsetLeftRefs.current = tabRefs.current.map((el) => el.offsetLeft);
  }, [tabPanelsClientWidth]);


  React.useEffect(() => {

    if (!skipForcedScrollRef.current) {
      skipSettingIndexRef.current = true;

      tabPanelsRef.current.style = "scroll-snap-type: none";
      animateScrollTo([index * tabPanelsClientWidth, 0], {
        elementToScroll: tabPanelsRef.current,
        // minDuration: 350,
        maxDuration: 300,

        // acceleration until halfway, then deceleration
        easing: (t) => {
          return --t * t * t + 1;
        }
      })
        .then(() => {
          skipSettingIndexRef.current = false;

          tabPanelsRef.current.style = "scroll-snap-type: x mandatory";

          // On ios, setting scroll-snap-type resets the scroll position
          // so we need to reajust it to where it was before.
          tabPanelsRef.current.scrollTo(
            index * tabPanelsClientWidth,
            0
          );
        })
        .finally(() => { });
    } else {
      skipForcedScrollRef.current = false;
    }

  }, [index, tabPanelsClientWidth]);

  const startAnimation = React.useCallback((scroll) => {
    const relativeScroll = scroll / tabPanelsClientWidth;
    const direction = previousRelativeScrollRef.current < relativeScroll ? RIGHT : LEFT;

    let {previousTab, currentTab, nextTab} = getWorkingTabs({
      previousTabRef,
      previousIndex,  
      tabRefs,
      direction,
      relativeScroll,
      previousRelativeScrollRef
    });
    
    const currentTabIndex = tabRefs.current.findIndex(tab => tab === currentTab);

    scrollLeftRef.current = tabOffsetLeftRefs.current[currentTabIndex];

    let { translateX, scaleX } = calculateTransform({
      currentTab, 
      previousTab, 
      nextTab, 
      direction, 
      relativeScroll, 
      scrollLeftRef, 
      currentTabIndex, 
      tabRefs,
    });

    indicatorScaleXRef.current = scaleX;
    indicatorTranslateXRef.current = translateX;
    
    requestAnimationFrame(() => {
      const scaleXCss = `scaleX(${indicatorScaleXRef.current})`;
      const translateXCss = `translateX(${indicatorTranslateXRef.current}px)`;

      tabIndicatorRef.current.style.transform = `${translateXCss} ${scaleXCss}`;
    });

    if (previousTab !== currentTab) {
      if (!skipSettingIndexRef.current && index !== currentTabIndex) {
        skipForcedScrollRef.current = true;
        setIndex(currentTabIndex);
      }

      setTabIndicatorWidth(currentTab.clientWidth);
    }

    previousRelativeScrollRef.current = relativeScroll;

    if (previousTab !== currentTab) {
      previousTabRef.current = currentTab;
    }
  }, [tabPanelsClientWidth, index]);

  const onScrollListener = React.useCallback((e) => {
    startAnimation(e.target.scrollLeft);
  }, [startAnimation]);

  React.useEffect(() => {
    tabPanelsRef.current.addEventListener("scroll", onScrollListener);

    return () => {
      tabPanelsRef.current.removeEventListener("scroll", onScrollListener);
    };
  }, [onScrollListener]);

  return { tabIndicatorWidth, index, setIndex, startAnimation };
}
// @ts-nocheck
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";
import { flushSync } from 'react-dom';

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

function calculateTransform({currentTab, previousTab, nextTab, direction, relativeScroll, currentTabIndex, tabRefs}) {
    let currentTabScrollProgress;
    let scaleX;
    let translateX;
    let nextTabWidth;
    let currentTabWidth = currentTab.clientWidth;
    let offsetLeft = currentTab.offsetLeft || 0;

    if (currentTab !== nextTab || previousTab !== currentTab) {
      currentTabScrollProgress = direction === RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);

      nextTabWidth = nextTab.clientWidth;

      scaleX = calculateScaleX(nextTabWidth, currentTabWidth, currentTabScrollProgress);

      if (direction === RIGHT) {
        translateX = offsetLeft + (relativeScroll % 1) * currentTabWidth;
      } else {
        translateX = offsetLeft - (1 - (relativeScroll % 1 || 1)) * nextTabWidth;
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
        translateX = offsetLeft - currentTabScrollProgress * nextTabWidth;
      } else {
        translateX = offsetLeft + currentTabScrollProgress * currentTabWidth;
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

  useEffect(() => {
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
  const skipSettingIndexRef = React.useRef(false);
  const skipForcedScrollRef = React.useRef(false);
  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);

  React.useLayoutEffect(() => {
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    skipForcedScrollRef.current = true;
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

  const onScroll = React.useCallback((e) => {
    const relativeScroll = e.target.scrollLeft / tabPanelsClientWidth;
    const direction = previousRelativeScrollRef.current <= relativeScroll ? RIGHT : LEFT;
    let {previousTab, currentTab, nextTab} = getWorkingTabs({
      previousTabRef,
      previousIndex,  
      tabRefs,
      direction,
      relativeScroll,
      previousRelativeScrollRef
    });
    
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
    });

    if (previousTab !== currentTab) {
      if (!skipSettingIndexRef.current && index !== currentTabIndex) {
        skipForcedScrollRef.current = true;
        
        if (flushSync) {
          flushSync(() => setIndex(currentTabIndex));
        } else {
          setIndex(currentTabIndex);
        }
      }

      if (flushSync) {
        flushSync(() => setTabIndicatorWidth(currentTab.clientWidth));
      } else {
        setTabIndicatorWidth(currentTab.clientWidth);
      }
    }

    previousRelativeScrollRef.current = relativeScroll;

    if (previousTab !== currentTab) {
      previousTabRef.current = currentTab;
    }
  }, [tabPanelsClientWidth, index]);

  React.useLayoutEffect(() => {
    tabPanelsRef.current.addEventListener("scroll", onScroll);

    return () => {
      tabPanelsRef.current.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  return { tabIndicatorWidth, index, setIndex };
}
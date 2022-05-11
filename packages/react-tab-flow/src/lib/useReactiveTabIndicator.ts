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

export default function useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef }) {
  const [tabIndicatorWidth, setTabIndicatorWidth] = useState(null);
  const previousRelativeScrollRef = React.useRef(0);
  const indicatorXPositionRef = React.useRef(0);
  const indicatorXScaleRef = React.useRef(1);
  const [index, setIndex] = useState(0);
  const previousTabRef = React.useRef(null);
  const previousIndex = usePrevious(index);
  const scrollLeftRef = React.useRef(0);
  const skipSettingIndexRef = React.useRef(false);
  const skipForcedScrollRef = React.useRef(false);
  const skipScrollAnimationRef = React.useRef(false);

  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);
  const previousTabPanelsClientWidth = usePrevious(tabPanelsClientWidth);
  const tabClientWidthRefs = React.useRef();
  const tabOffsetLeftRefs = React.useRef();
  const rafActiveRef = React.useRef(false);
  const rafIdRef = React.useRef();
  const targetTranslateXRef = React.useRef();
  const targetScaleXRef = React.useRef();
  React.useLayoutEffect(() => {
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    skipForcedScrollRef.current = true;
    tabClientWidthRefs.current = tabRefs.current.map((el) => el.clientWidth);
    tabOffsetLeftRefs.current = tabRefs.current.map((el) => el.offsetLeft);
  }, [tabPanelsClientWidth]);


  React.useEffect(() => {

    if (!skipForcedScrollRef.current) {
      skipSettingIndexRef.current = true;

      tabPanelsRef.current.style = "scroll-snap-type: none";
      animateScrollTo([index * tabPanelsClientWidth, 0], {
        elementToScroll: tabPanelsRef.current,
        // minDuration: 350,
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

  const onScrollChanged = () => {
    function updateAnimation(originTranslateX, originScaleX) {
      originTranslateX = targetTranslateXRef.current;
      originScaleX = targetScaleXRef.current;
      rafActiveRef.current = false;

      const scaleXCss = `scaleX(${originScaleX})`;
      const translateXCss = `translateX(${originTranslateX}px)`;

      tabIndicatorRef.current.style.transform = `${translateXCss} ${scaleXCss}`;
    }
    updateAnimation(indicatorXPositionRef.current, indicatorXScaleRef.current);
  };

  const startAnimation = React.useCallback((scroll) => {
    const relativeScroll = scroll / tabPanelsClientWidth;
    console.log('teste')
    const RIGHT = "RIGHT";
    const LEFT = "LEFT";


    const direction =
      previousRelativeScrollRef.current < relativeScroll ? RIGHT : LEFT;

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

    if (!currentTab) {
      throw new Error("Unhandled case for currentTab!");
    }

    const currentTabIndex = tabRefs.current.findIndex(
      (tab) => tab === currentTab
    );

    const currentTabWidth = tabClientWidthRefs.current[currentTabIndex];

    let nextTabFromScrollDirection =
      direction === RIGHT
        ? tabRefs.current[Math.ceil(relativeScroll)]
        : tabRefs.current[Math.floor(relativeScroll)];

    scrollLeftRef.current = tabOffsetLeftRefs.current[currentTabIndex];

    let nextTabFromScrollDirectionWidth;
    let translateX;
    let scaleX;

    let currentTabScrollProgress;

    if (
      currentTab !== nextTabFromScrollDirection ||
      previousTabRef.current !== currentTab
    ) {
      currentTabScrollProgress =
        direction === RIGHT ? relativeScroll % 1 : 1 - (relativeScroll % 1);

      nextTabFromScrollDirectionWidth = nextTabFromScrollDirection.clientWidth;

      scaleX = calculateScaleX(
        nextTabFromScrollDirectionWidth,
        currentTabWidth,
        currentTabScrollProgress
      );

      if (direction === RIGHT) {
        translateX =
          scrollLeftRef.current + (relativeScroll % 1) * currentTabWidth;
      } else {
        translateX =
          scrollLeftRef.current -
          (1 - (relativeScroll % 1 || 1)) * nextTabFromScrollDirectionWidth;
      }
    } else {
      currentTabScrollProgress =
        direction === RIGHT
          ? 1 - (relativeScroll % 1 || 1)
          : relativeScroll % 1;

      let wasGonnaBeNextTab;
      let wasGonnaBeNextTabIndex;
      if (direction === LEFT) {
        wasGonnaBeNextTabIndex = currentTabIndex + 1;
        wasGonnaBeNextTab = tabRefs.current[wasGonnaBeNextTabIndex];
      } else {
        wasGonnaBeNextTabIndex = currentTabIndex - 1;
        wasGonnaBeNextTab = tabRefs.current[wasGonnaBeNextTabIndex];
      }
      nextTabFromScrollDirectionWidth =
        tabClientWidthRefs.current[wasGonnaBeNextTabIndex];

      scaleX = calculateScaleX(
        nextTabFromScrollDirectionWidth,
        currentTabWidth,
        currentTabScrollProgress
      );

      if (direction === RIGHT) {
        translateX =
          scrollLeftRef.current -
          currentTabScrollProgress * nextTabFromScrollDirectionWidth;
      } else {
        translateX =
          scrollLeftRef.current + currentTabScrollProgress * currentTabWidth;
      }
    }

    targetTranslateXRef.current = translateX;
    targetScaleXRef.current = scaleX;
    if (!rafActiveRef.current) {
      rafActiveRef.current = true;
      rafIdRef.current = requestAnimationFrame(() => onScrollChanged());
    }

    indicatorXScaleRef.current = targetScaleXRef.current;
    indicatorXPositionRef.current = targetTranslateXRef.current;

    // console.log({ //   transform: tabIndicatorRef.current.style.transform,
    //   currentTab: currentTab.textContent,
    //   previousTabRef: previousTabRef.current.textContent
    // });
    if (previousTabRef.current !== currentTab) {
      if (!skipSettingIndexRef.current && index !== currentTabIndex) {
        // console.log("setting index from scroll to", currentTabIndex);
        skipForcedScrollRef.current = true;
        setIndex(currentTabIndex);
      }
      // console.log("setting tab indicator width to", currentTabWidth);

      setTabIndicatorWidth(currentTabWidth);

      // Is this really necessary? Commenting it out as it needs more testing.
      // tabIndicatorRef.current.style.transform = `${translateXCss} scaleX(1)`;
    }

    previousRelativeScrollRef.current = relativeScroll;

    if (previousTabRef.current !== currentTab) {
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
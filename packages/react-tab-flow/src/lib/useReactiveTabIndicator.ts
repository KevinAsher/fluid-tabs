// @ts-nocheck
import React, { useState, useRef } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";

function usePrevious(value) {
  const ref = React.useRef();
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef }) {
  const [tabIndicatorWidth, setTabIndicatorWidth] = useState(null);
  const lastRelativeScroll = React.useRef(0);
  const indicatorXPositionRef = React.useRef(0);
  const indicatorXScaleRef = React.useRef(1);
  const [index, setIndex] = useState(0);
  const lastTabRef = React.useRef(null);
  const previousIndex = usePrevious(index);
  const scrollLeftRef = React.useRef(0);
  const skipSettingIndexRef = React.useRef(false);
  const skipForcedScrollRef = React.useRef(false);
  const tabPanelsClientWidthRef = React.useRef();
  const tabClientWidthRefs = React.useRef();
  const tabOffsetLeftRefs = React.useRef();
  const rafActiveRef = React.useRef(false);
  const rafIdRef = React.useRef();
  const targetTranslateXRef = React.useRef();
  const targetScaleXRef = React.useRef();
  const { width } = useWindowSize();
  const lockRef = useRef(false);

  React.useLayoutEffect(() => {
    // console.log(
    //   "setting tabIndicatorRef to",
    //   tabIndicatorRef.current.clientWidth
    // );
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    tabPanelsClientWidthRef.current = tabPanelsRef.current.clientWidth;

    tabClientWidthRefs.current = tabRefs.current.map((el) => el.clientWidth);
    tabOffsetLeftRefs.current = tabRefs.current.map((el) => el.offsetLeft);
  }, [width]);

  React.useEffect(() => {
    console.log("onChange just ran", index);

    if (!skipForcedScrollRef.current) {
      skipSettingIndexRef.current = true;

      tabPanelsRef.current.style = "scroll-snap-type: none";
      lockRef.current = true;
      animateScrollTo([index * tabPanelsRef.current.clientWidth, 0], {
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
          lockRef.current = false;

          tabPanelsRef.current.style = "scroll-snap-type: x mandatory";

          // On ios, setting scroll-snap-type resets the scroll position
          // so we need to reajust it to where it was before.
          tabPanelsRef.current.scrollTo(
            index * tabPanelsRef.current.clientWidth,
            0
          );
        })
        .finally(() => { });
    } else {
      console.log("animateScrollTo was skipped");
      skipForcedScrollRef.current = false;
    }

    // console.log({ index });
  }, [index]);

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
    const relativeScroll = scroll / tabPanelsClientWidthRef.current;

    const RIGHT = "RIGHT";
    const LEFT = "LEFT";

    function calculateScaleX(
      nextTabWidth,
      currentTabWidth,
      currentTabScrollProgress
    ) {
      let scaleX;
      const tabWidthRatio = nextTabWidth / currentTabWidth;

      if (tabWidthRatio < 1) {
        scaleX = 1 - currentTabScrollProgress * (1 - tabWidthRatio);
      } else {
        scaleX = 1 + currentTabScrollProgress * (tabWidthRatio - 1);
      }

      return scaleX;
    }

    const direction =
      lastRelativeScroll.current < relativeScroll ? RIGHT : LEFT;

    let currentTab = null;
    if (lastTabRef.current === null) {
      currentTab = tabRefs.current[previousIndex || 0];
      lastTabRef.current = currentTab;
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
       *   Last Relative scroll    Current Relative scroll
       *
       *   Valid Previous currentTab:
       *   - T1 (Scrolling left to right)
       *   - T2 (Was already on T2, scrolled left a bit, then scrolled right again)
       */

      if (Math.trunc(relativeScroll) > Math.trunc(lastRelativeScroll.current)) {
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
         *   Last Relative scroll    Current Relative scroll
         *
         *   Valid Previous currentTab:
         *   - T2 (Already on T2 and scrolling left to right)
         *   - T3 (scrolling left to right from T3, and then right to lef)
         */

        // don't do anything on this case because is not on a switching point
        currentTab = lastTabRef.current;
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
       *   Current Relative scroll    Last Relative scroll
       *
       *   Valid Previous currentTab:
       *   - T2 (was already on T2 scrolling right to left)
       *   - T3 (scrolling right to left)
       */

      if (
        Math.trunc(relativeScroll) < Math.trunc(lastRelativeScroll.current) ||
        relativeScroll % 1 === 0
      ) {
        currentTab = tabRefs.current[Math.trunc(lastRelativeScroll.current)];
      } else {
        /**
         *   Scroll Direction <--
         *              |----T1----|----T2----|----T3----|
         *                           ----------
         *                           ^ ----------
         *                           ^ ^
         *   ________________________^ ^________________________
         *   Current Relative scroll    Last Relative scroll
         *
         *   Valid Previous currentTab:
         *   - T2 (was already on T2 scrolling left to right, and then right to left)
         *   - T3 (scrolling left to right)
         */

        // don't do anything on this case because is not on a switching point
        currentTab = lastTabRef.current;
      }
    }

    if (!currentTab) {
      alert("Unhandled case for currentTab!");
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
      lastTabRef.current !== currentTab
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

    // console.log({
    //   transform: tabIndicatorRef.current.style.transform,
    //   currentTab: currentTab.textContent,
    //   lastTabRef: lastTabRef.current.textContent
    // });
    if (lastTabRef.current !== currentTab) {
      if (!skipSettingIndexRef.current && index !== currentTabIndex) {
        // console.log("setting index from scroll to", currentTabIndex);
        if (!lockRef.current) {
          skipForcedScrollRef.current = true;
        }
        setIndex(currentTabIndex);
      }
      // console.log("setting tab indicator width to", currentTabWidth);

      setTabIndicatorWidth(currentTabWidth);

      // Is this really necessary? Commenting it out as it needs more testing.
      // tabIndicatorRef.current.style.transform = `${translateXCss} scaleX(1)`;
    }

    lastRelativeScroll.current = relativeScroll;

    if (lastTabRef.current !== currentTab) {
      lastTabRef.current = currentTab;
    }
  }, []);

  return { tabIndicatorWidth, index, setIndex, startAnimation };
}
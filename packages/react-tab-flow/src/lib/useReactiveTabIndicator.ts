// @ts-nocheck
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";
import ReactDOM from 'react-dom';

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}


function scrollPromise(element, options) {
  return new Promise((resolve, reject) => {

      element.parentElement.scroll(options);
      const intersectionObserver = new IntersectionObserver((entries) => {
        let [entry] = entries;
        
        if (entry.isIntersecting) {
        
          intersectionObserver.unobserve(element);
          resolve();
        }
      }, {root: element.parentElement, threshold: 1.0 });
      
      // I start to observe the element where I scrolled 
      intersectionObserver.observe(element);
  })
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
      } else {
        wasGonnaBeNextTabIndex = currentTabIndex - 1;
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
    if (Math.trunc(relativeScroll) > Math.trunc(previousRelativeScrollRef.current)) {
      currentTab = tabRefs.current[Math.trunc(relativeScroll)];
    } else {
      currentTab = previousTabRef.current;
    }
  } else if (direction === LEFT) {
    if (
      Math.trunc(relativeScroll) < Math.trunc(previousRelativeScrollRef.current) ||
      relativeScroll % 1 === 0
    ) {
      currentTab = tabRefs.current[Math.trunc(previousRelativeScrollRef.current)];
    } else {
      currentTab = previousTabRef.current;
    }
  }


  let nextTab = direction === RIGHT
    ? tabRefs.current[Math.ceil(relativeScroll)]
    : tabRefs.current[Math.floor(relativeScroll)];

  if (!currentTab) {
    throw new Error("Unhandled case for currentTab!");
  }
  return { previousTab: previousTabRef.current, currentTab, nextTab}
}

export default function useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef, defaultIndex=0 }) {
  const [tabIndicatorWidth, setTabIndicatorWidth] = useState(null);
  const previousRelativeScrollRef = useRef(0);
  const indicatorTranslateXRef = useRef(0);
  const indicatorScaleXRef = useRef(1);
  const [index, setIndex] = useState(defaultIndex);
  const previousTabRef = useRef(null);
  const previousIndex = usePrevious(index);
  const skipSettingIndexRef = useRef(false);
  const skipForcedScrollRef = useRef(false);
  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);

  useLayoutEffect(() => {
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    tabIndicatorRef.current.style.width = tabRefs.current[index].clientWidth + 'px';
    skipForcedScrollRef.current = true;
  }, [tabPanelsClientWidth]);

  useLayoutEffect(() => {
    if (index === defaultIndex && tabIndicatorRef.current) {
      tabPanelsRef.current.scrollLeft = index * tabPanelsClientWidth;
    }
  }, [tabPanelsClientWidth, tabIndicatorRef.current])

  useEffect(() => {

    if (!skipForcedScrollRef.current) {
      skipSettingIndexRef.current = true;
      const scrollOptions = {left: index * tabPanelsClientWidth, behavior: "smooth"} ;
      scrollPromise(tabPanelsRef.current.children[index], scrollOptions).then(() => {
          skipSettingIndexRef.current = false;
      });

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
        
        if (ReactDOM.flushSync) {
          ReactDOM.flushSync(() => setIndex(currentTabIndex));
          ReactDOM.flushSync(() => setTabIndicatorWidth(currentTab.clientWidth));
        } else {
          setIndex(currentTabIndex);
          setTabIndicatorWidth(currentTab.clientWidth);
        }

        //tabIndicatorRef.current.style.width = currentTab.clientWidth + 'px';
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
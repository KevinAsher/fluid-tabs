// @ts-nocheck
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import useWindowSize from "./useWindowSize";
import animateScrollTo from "animated-scroll-to";
import ReactDOM from 'react-dom';

let useTransition;

if (React.useTransition) {
  useTransition = React.useTransition;
} else {
  useTransition = () => [null, null];
}

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
    let offsetLeft = currentTab.offsetLeft || 0;

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

function clamp(number, min, max) {
  return Math.max(min, Math.min(number, max));
} 

function getWorkingTabs({previousTab, previousIndex, tabRefs, direction, relativeScroll, previousRelativeScroll}) {
  let currentTab = null;
  if (previousTab === null) {
    currentTab = tabRefs.current[previousIndex || 0];
    previousTab = currentTab;
  }

  if (direction === RIGHT) {
    if (Math.trunc(relativeScroll) > Math.trunc(previousRelativeScroll)) {
      currentTab = tabRefs.current[Math.trunc(relativeScroll)];
    } else {
      currentTab = previousTab;
    }
  } else if (direction === LEFT) {
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
  let lastTabIndex = tabRefs.current.length - 1;
  
  if (direction === RIGHT) {
    nextTabIndex = clamp(Math.ceil(relativeScroll), 0, lastTabIndex);
  } else {
    nextTabIndex = clamp(Math.floor(relativeScroll), 0, lastTabIndex);
  }

  let nextTab = tabRefs.current[nextTabIndex];

  if (relativeScroll < 0 || relativeScroll > lastTabIndex) {
    previousTab = nextTab;
    currentTab = nextTab;
  }
  
  return { previousTab, currentTab, nextTab, }
}

export default function useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef, defaultIndex=0, preemptive=false }) {
  const [tabIndicatorWidth, setTabIndicatorWidth] = useState(null);
  const previousRelativeScrollRef = useRef(0);
  const indicatorTranslateXRef = useRef(0);
  const indicatorScaleXRef = useRef(1);
  const [index, setIndex] = useState(defaultIndex);
  const previousTabRef = useRef(null);
  const previousIndex = usePrevious(index);
  const shouldSkipSettingIndexRef = useRef(false);
  const shouldSkipForcedScrollRef = useRef(false);
  const tabPanelsClientWidth = useTabPanelsClientWidth(tabPanelsRef);
  const isTouchingScreenRef = useRef(false);

  useLayoutEffect(() => {
    setTabIndicatorWidth(tabRefs.current[index].clientWidth);
    shouldSkipForcedScrollRef.current = true;
  }, [tabPanelsClientWidth]);

  useLayoutEffect(() => {
    if (index === defaultIndex && tabPanelsRef.current) {
      tabPanelsRef.current.scrollLeft = index * tabPanelsClientWidth;
    }
  }, [tabPanelsClientWidth, tabIndicatorRef.current])

  useEffect(() => {

    if (!shouldSkipForcedScrollRef.current) {
      shouldSkipSettingIndexRef.current = true;
      tabPanelsRef.current.style = "scroll-snap-type: none";
      // animateScrollTo([index * tabPanelsClientWidth, 0], {
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

    const relativeScroll = Math.abs(Math.round(relativeScrollRaw) - relativeScrollRaw) < 0.001 ? Math.round(relativeScrollRaw) : relativeScrollRaw;
    const direction = previousRelativeScrollRef.current <= relativeScroll ? RIGHT : LEFT;


    // console.log(scrollLeft, tabPanelsClientWidth, scrollLeft / tabPanelsClientWidth, Math.abs(Math.round(relativeScrollRaw) - relativeScrollRaw))

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


    if (startTransition && preemptive && !isTouchingScreenRef.current) {
      if (Math.round(relativeScrollRaw) !== index && !shouldSkipSettingIndexRef.current) {
        startTransition(() => {
          setIndex(Math.round(relativeScroll));
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
    tabIndicatorRef.current.style.width = currentTab.clientWidth + 'px';

    if (index === currentTabIndex) {
      setTabIndicatorWidth(currentTab.clientWidth);
    } else if (!shouldSkipSettingIndexRef.current) {
      shouldSkipForcedScrollRef.current = true;
      setIndex(currentTabIndex);
      setTabIndicatorWidth(currentTab.clientWidth);
    }
    
  }, [tabPanelsClientWidth, index]);

  // const onScroll = React.useCallback((e) => {
  //   handleScrollChange(e.target.scrollLeft);
  // }, [handleScrollChange]);

  React.useLayoutEffect(() => {
    function onResize() {
      const currentTab = tabRefs.current[index];
      setTabIndicatorWidth(currentTab.clientWidth);
    }
    // console.log({index})

    tabPanelsRef.current?.addEventListener("scroll", onScroll);
    // window.addEventListener("resize", onResize);
    // console.log('running useLayoutEffect')

    return () => {
    // console.log({index})
      // console.log('cleanup useLayoutEffect')
      tabPanelsRef.current?.removeEventListener("scroll", onScroll);
      // window.removeEventListener("resize", onResize);
    };
  }, [onScroll]);


  React.useEffect(() => {

    function setTouchingFlag() {
      isTouchingScreenRef.current = true;
    }

    function unsetTouchingFlag() {
      isTouchingScreenRef.current = false;
    }

    tabPanelsRef.current?.addEventListener('touchend', unsetTouchingFlag, {passive: true});
    tabPanelsRef.current?.addEventListener('touchstart', setTouchingFlag, {passive: true});
    return () => {
      tabPanelsRef.current?.removeEventListener('touchend', unsetTouchingFlag);
      tabPanelsRef.current?.removeEventListener('touchstart', setTouchingFlag);
    }
  }, [tabPanelsClientWidth, index, setIndex, tabIndicatorRef.current])

  return { tabIndicatorWidth, index, setIndex };
}
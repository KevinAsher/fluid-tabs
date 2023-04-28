import animateScrollTo, { type IUserOptions } from "animated-scroll-to";
import {
  calculateTransform,
  Direction,
  getKeyByValue,
  getWorkingTabs
} from './utils' ;
import afterFrame from "./utils/afterFrame";
import ownerWindow from "./utils/ownerWindow";

// Depending on the device pixel ratio, a scroll container might not be able
// to scroll until it's full width as it should (might be a browser bug). Since the definition is unclear,
// we define an empirical limit ratio.
const SCROLL_RATIO_LIMIT = 0.001;

const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export default class TabIndicatorManager {

  private previousRelativeScroll: number | null = null;
  private previousTab: HTMLElement | null  = null;
  private tabPanels: HTMLElement;
  private tabs: HTMLElement[];
  private tabIndicator: HTMLElement;
  private valueToIndex: Map<any, number>;
  private canChangeTab = true;
  private canAnimateScrollToPanel = true;
  private tabChangeCallback: (value: any) => void;
  private resizeCallback?: () => void;
  public value: any;
  public resizeObserver;
  private previousScrollLeft = 0;
  private __updated = false;
  private __updateScheduled = false;

  constructor(value: any, tabIndicator: HTMLElement, tabPanels: HTMLElement, tabs: HTMLElement[], valueToIndex: Map<any, number>, tabChangeCallback: (value: any) => void, resizeCallback?: () => void) {
    this.value = value;
    this.tabIndicator = tabIndicator;
    this.tabPanels = tabPanels;
    this.tabs = tabs;
    this.valueToIndex = valueToIndex;
    this.tabChangeCallback = tabChangeCallback;
    this.resizeCallback = resizeCallback;

    this.tabPanels.addEventListener("scroll", () => {
      if (!this.__updateScheduled) {
        this.scheduleUpdate();
        this.__updateScheduled = true;
      }
    });

    const win = ownerWindow(this.tabPanels);
    win.addEventListener('resize', this.resizeHandler);


    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.resizeHandler);
      this.resizeObserver.observe(this.tabPanels);
    }
  }

  hasScrolled = () => {
    const scrollDetected = this.previousScrollLeft !== this.tabPanels.scrollLeft;

    if (scrollDetected) this.previousScrollLeft = this.tabPanels.scrollLeft;
    
    return scrollDetected;
  }

  scheduleUpdate = () => {
    afterFrame(() => {
      this.__updated = false;
      this.update();
    });
  }

  update = () => {
    if (!this.__updated && this.hasScrolled()) {
      this.scrollHandler({target: this.tabPanels});
      this.scheduleUpdate();
      this.__updated = true;
    } else {
      this.__updateScheduled = false;
    }
  }

  cleanup = () => {
    this.tabPanels?.removeEventListener("scroll", this.scrollHandler);
    this.resizeObserver?.disconnect();
    const win = ownerWindow(this.tabPanels);
    win.removeEventListener("resize", this.resizeHandler);
  }

  getCurrentTab = () => {
    return this.tabs[this.valueToIndex.get(this.value)!];
  }

  getIndex = (value?: any) => {
    return this.valueToIndex.get(value ?? this.value)!;
  }

  resizeHandler = (event: any) => {
    this.tabIndicator.style.transform = `translateX(${this.getCurrentTab().offsetLeft}px) scaleX(1)`;
    // this.tabIndicator.style.visibility = 'visible';
    this.tabPanels.scrollLeft = this.getIndex() * this.tabPanels.clientWidth;

    if (this.getIndex() === 0) {
      // We need to force a scroll event here since setting scrollLeft
      // to a number that dosen't cause scroll won't trigger are
      // scroll listener. 
      this.tabPanels.dispatchEvent(new CustomEvent('scroll'));
    }
    this.resizeCallback?.();
  }

  scrollHandler = (event: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = event.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // We can't use tabPanelsClientWidth here because we might get an outdated width from a screen orietation change
    // which will cause a scroll before tabPanelsClientWidth gets a chance to update.
    const relativeScrollRaw = scrollLeft / this.tabPanels.getBoundingClientRect().width;

    const closestIndexFromScrollPosition = Math.round(relativeScrollRaw);

    // Same as relativeScrollRaw, but with it's value snapped to the closest tab panel index when it's very close.
    const relativeScroll = Math.abs(closestIndexFromScrollPosition - relativeScrollRaw) < SCROLL_RATIO_LIMIT ? closestIndexFromScrollPosition : relativeScrollRaw;

    // Only initialize required ref values on initial scroll.
    if (this.previousRelativeScroll === null) {
      this.previousRelativeScroll = relativeScroll;
      this.previousTab = this.tabs[Math.trunc(relativeScroll)];
      return;
    }

    // skip if there wasn't a change on scroll
    if (relativeScroll === this.previousRelativeScroll) {
      return;
    } 

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > this.tabs.length - 1) return;

    const direction = this.previousRelativeScroll <= relativeScroll ? Direction.RIGHT : Direction.LEFT;

    const destinationIndex = this.valueToIndex.get(this.value);

    const isSnapped = relativeScroll % 1 === 0 && relativeScroll === destinationIndex;

    if (!isSnapped && closestIndexFromScrollPosition !== destinationIndex && this.canChangeTab) {
      this.tabChangeCallback(getKeyByValue(this.valueToIndex, closestIndexFromScrollPosition));
      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }

    if (isSnapped) {
      this.__updateScheduled = false;
    }

    let {currentTab, nextTab} = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: this.tabs,
      previousTab: this.previousTab, 
      previousRelativeScroll: this.previousRelativeScroll,
    });

    const currentTabIndex = this.tabs.findIndex(tab => tab === currentTab);

    let { translateX, scaleX } = calculateTransform({
      currentTab, 
      nextTab, 
      direction, 
      relativeScroll, 
      currentTabIndex, 
      previousTab: this.previousTab,
      tabs: this.tabs,
    });

    requestAnimationFrame(() => {
      const scaleXCss = `scaleX(${scaleX})`;
      const translateXCss = `translateX(${translateX}px)`;

      this.tabIndicator.style.transform = `${translateXCss} ${scaleXCss}`;
    });
    

    // set previous relative scroll for the next scroll event
    this.previousRelativeScroll = relativeScroll;

    // currentTab will be previousTab until there is a tab switch.
    if (this.previousTab === currentTab) return;
   
    // set previous tab for next scroll event
    this.previousTab = currentTab;

    requestAnimationFrame(() => {
      /* 
        Update the tab indicator width outside React for performance reasons. This will
        cause this element to be out of sync between react and the dom but it's a temporary out of sync.
        This is only for when the indicator is passing by other tabs until it reaches it's
        destination tab. Once it reaches it, we re-sync the elements width with it's actual state.
      */
      this.tabIndicator.style.width = currentTab.clientWidth + 'px';
    });

  }

  changeTab = (value: any) => {
    
    this.value = value;
    this.canChangeTab = true;

    if (!this.tabPanels) return;

    if (!this.canAnimateScrollToPanel) {
      this.canAnimateScrollToPanel = true;
      return;
    }
    
    /* Animate scrolling to the relevant tab panel */
    this.canChangeTab = false;
    this.tabPanels.style.scrollSnapType = "none";

    const index = this.getIndex(value);

    animateScrollTo([index * this.tabPanels.getBoundingClientRect().width, 0], {
      minDuration: 500,
      maxDuration: 800,
      easing: easeInOutCubic,
      // ...animateScrollToOptions,
      elementToScroll: this.tabPanels,
      cancelOnUserAction: false,
    }).then((hasScrolledToPosition) => {
      if (hasScrolledToPosition) {
        this.canChangeTab = true;
        
        this.tabPanels.style.scrollSnapType = "x mandatory";

        // On ios < 15, setting scroll-snap-type resets the scroll position
        // so we need to reajust it to where it was before.
        this.tabPanels.scrollLeft = index * this.tabPanels.getBoundingClientRect().width;
      }

    }).catch(() => {
        this.tabPanels.style.scrollSnapType = "x mandatory";
    });

  }
}
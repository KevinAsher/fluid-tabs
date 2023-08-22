import animateScrollTo, { type IUserOptions } from "animated-scroll-to";
import {
  calculateTransform,
  Direction,
  getKeyByValue,
  getWorkingTabs
} from './utils' ;
import ScrollManager from "./ScrollManager";

const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

export interface TabIndicatorManagerConstructorParams {
  value: any
  switchThreshold?: number
  tabIndicator: HTMLElement
  tabPanels: HTMLElement
  tabs: HTMLElement[]
  valueToIndex: Map<any, number>

  /**
   * Setter to control the current active tab.
   */
  onChange: (value: any) => void

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions
}

export default class TabIndicatorManager {

  private previousTab: HTMLElement | null = null;
  private tabPanels: HTMLElement;
  private tabs: HTMLElement[];
  public tabIndicator: HTMLElement;
  private valueToIndex: Map<any, number>;
  private canChangeTab = true;
  private canAnimateScrollToPanel = true;
  private onChange: (value: any) => void;
  public value: any;
  public switchThreshold: number;
  private animateScrollToOptions?: IUserOptions;
  private scrollManager: ScrollManager;

  constructor({value, switchThreshold=0.5, tabIndicator, tabPanels, tabs, valueToIndex, onChange, animateScrollToOptions}: TabIndicatorManagerConstructorParams) {
    this.value = value;
    this.tabIndicator = tabIndicator;
    this.tabPanels = tabPanels;
    this.tabs = tabs;
    this.valueToIndex = valueToIndex;
    this.onChange = onChange;
    this.switchThreshold = switchThreshold;
    this.animateScrollToOptions = animateScrollToOptions;
    this.scrollManager = new ScrollManager({
      scrollTarget: this.tabPanels,
      axis: 'x',
      scrollHandler: this.scrollHandler,
      resizeHandler: this.resizeHandler,
    })

  }

  cleanup = () => this.scrollManager.cleanup();

  getCurrentTab = () => {
    return this.tabs[this.valueToIndex.get(this.value)!];
  }

  getIndex = (value?: any) => {
    return this.valueToIndex.get(value ?? this.value)!;
  }

  resizeHandler = (event: any) => {
    this.tabIndicator.style.transform = `translateX(${this.getCurrentTab().offsetLeft}px) scaleX(1)`;
    this.tabIndicator.style.width = `${this.getCurrentTab().clientWidth}px`;
    // this.tabIndicator.style.visibility = 'visible';
    this.tabPanels.scrollLeft = this.getIndex() * this.tabPanels.clientWidth;

    if (this.getIndex() === 0) {
      // We need to force a scroll event here since setting scrollLeft
      // to a number that dosen't cause scroll won't trigger are
      // scroll listener. 
      this.tabPanels.dispatchEvent(new CustomEvent('scroll'));
    }
  }

  scrollDrivenTabChange = (relativeScroll: number) => {
    const closestIndexFromScrollPosition = Math.round(relativeScroll);
    const destinationIndex = this.valueToIndex.get(this.value)!;
    const shouldChangeTab = Math.abs(relativeScroll - destinationIndex) > this.switchThreshold;

    if (closestIndexFromScrollPosition !== destinationIndex && this.canChangeTab && shouldChangeTab) {
      this.onChange(getKeyByValue(this.valueToIndex, closestIndexFromScrollPosition));
      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }
  }

  scrollHandler = (event: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = event.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // We can't use tabPanelsClientWidth here because we might get an outdated width from a screen orietation change
    // which will cause a scroll before tabPanelsClientWidth gets a chance to update.
    const relativeScroll = scrollLeft / this.tabPanels.getBoundingClientRect().width;

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > this.tabs.length - 1) return;

    this.scrollDrivenTabChange(relativeScroll);

    const direction = this.scrollManager.getScrollDirection();

    let {currentTab, nextTab} = getWorkingTabs({
      direction,
      relativeScroll,
      tabs: this.tabs,
    });

    let { translateX, scaleX } = calculateTransform({
      currentTab, 
      nextTab, 
      direction, 
      relativeScroll, 
    });

    requestAnimationFrame(() => {
      const scaleXCss = `scaleX(${scaleX})`;
      const translateXCss = `translateX(${translateX}px)`;

      this.tabIndicator.style.transform = `${translateXCss} ${scaleXCss}`;
    });
    
    // currentTab will be previousTab until there is a tab switch.
    if (this.previousTab === currentTab) return;
   
    // set previous tab for next scroll event
    this.previousTab = currentTab;

    requestAnimationFrame(() => {
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
      ...this.animateScrollToOptions,
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
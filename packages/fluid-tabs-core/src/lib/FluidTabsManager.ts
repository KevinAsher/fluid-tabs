import { type IUserOptions } from "animated-scroll-to";
import ScrollManager from "./ScrollManager";
import TabPanelManager from "./TabPanelManager";
import TabIndicatorManager from "./TabIndicatorManager";
import ownerWindow from "./utils/ownerWindow";
import { getKeyByValue } from "./utils";

export type Value = string | number;
export interface FluidTabsManagerConstructorParams {
  value: Value;
  switchThreshold?: ThresholdRange;
  tabIndicator: HTMLElement;
  tabPanels: HTMLElement;
  tabs: HTMLElement[];
  valueToIndex: Map<Value, number>;
  disableScrollTimeline?: boolean;

  /**
   * Setter to control the current active tab.
   */
  changeActiveTabCallback: (value: Value) => void;

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions;
}

type ThresholdRange = 0.5 | 0.6 | 0.7 | 0.8 | 0.9;

export default class FluidTabsManager {
  public value: Value;
  public tabs: HTMLElement[];
  public tabIndicator: HTMLElement;
  public valueToIndex: Map<Value, number>;
  public canChangeTab = true;
  public canAnimateScrollToPanel = true;
  public changeActiveTabCallback: (value: Value) => void;
  public switchThreshold: ThresholdRange;
  private resizeObserver?: ResizeObserver;
  private win: Window;

  public scrollManager: ScrollManager;
  public tabIndicatorManager: TabIndicatorManager;
  public tabPanelManager: TabPanelManager;

  constructor({
    value,
    switchThreshold = 0.5,
    tabIndicator,
    tabPanels,
    tabs,
    valueToIndex,
    changeActiveTabCallback,
    disableScrollTimeline = false,
    animateScrollToOptions,
  }: FluidTabsManagerConstructorParams) {
    this.value = value;
    this.tabs = tabs;
    this.valueToIndex = valueToIndex;
    this.changeActiveTabCallback = changeActiveTabCallback;
    this.switchThreshold = switchThreshold;

    this.tabPanelManager = new TabPanelManager({
      element: tabPanels,
      animateScrollToOptions,
      getIndex: this.getIndex,
    });

    this.tabIndicatorManager = new TabIndicatorManager({
      tabPanels: tabPanels,
      tabs: tabs,
      element: tabIndicator,
      disableScrollTimeline,
    });

    this.scrollManager = new ScrollManager({
      scrollTarget: tabPanels,
      axis: "x",
      scrollHandler: this.scrollHandler,
    });

    this.win = ownerWindow(tabPanels);
    this.resizeHandler &&
      this.win.addEventListener("resize", this.resizeHandler);

    if (typeof ResizeObserver !== "undefined" && this.resizeHandler) {
      this.resizeObserver = new ResizeObserver(this.resizeHandler);
      this.resizeObserver.observe(tabPanels);
    }
  }

  cleanup = () => {
    this.scrollManager.cleanup();
    this.resizeObserver?.disconnect();
    this.resizeHandler &&
      this.win.removeEventListener("resize", this.resizeHandler);
  };

  getCurrentTab = () => {
    return this.tabs[this.valueToIndex.get(this.value)!];
  };

  getIndex = (value?: Value) => {
    return this.valueToIndex.get(value ?? this.value)!;
  };

  resizeHandler = () => {
    this.tabIndicatorManager.resizeHandler(this.getCurrentTab());
    this.tabPanelManager.resizeHandler();
  };

  changeActiveTab = (value: Value) => {
    if (this.canChangeTab) {
      this.changeActiveTabCallback(value);

      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }
  };

  changeActivePanel = async (value: Value) => {
    this.value = value;
    this.canChangeTab = true;

    if (!this.canAnimateScrollToPanel) {
      this.canAnimateScrollToPanel = true;
      return;
    }

    this.canChangeTab = false;

    const index = this.getIndex(value);

    const hasSwitchedToPanel = await this.tabPanelManager.animateToPanel(index);

    if (hasSwitchedToPanel) {
      this.canChangeTab = true;
    }
  };

  scrollHandler = (event: any) => {
    // Total amount of pixels scrolled in the scroll container
    const scrollLeft = event.target.scrollLeft;

    // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
    // 1.2 means we scrolled 20% of the second panel, etc.
    const relativeScroll =
      scrollLeft / this.tabPanelManager.element.getBoundingClientRect().width;

    // If we are overscroll beyond the boundaries of the scroll container, we just return and do nothing (e.g. Safari browser).
    if (relativeScroll < 0 || relativeScroll > this.tabs.length - 1) return;

    this.scrollDrivenTabChange(relativeScroll);

    this.tabIndicatorManager.update({
      relativeScroll,
      direction: this.scrollManager.getScrollDirection(),
    });
  };

  scrollDrivenTabChange = (relativeScroll: number) => {
    const closestIndexFromScrollPosition = Math.round(relativeScroll);
    const currentIndex = this.getIndex()!;
    const surpassedScrollThreshold =
      Math.abs(relativeScroll - currentIndex) > this.switchThreshold;

    if (
      closestIndexFromScrollPosition !== currentIndex &&
      surpassedScrollThreshold
    ) {
      this.changeActiveTab(
        getKeyByValue(this.valueToIndex, closestIndexFromScrollPosition),
      );
    }
  };
}

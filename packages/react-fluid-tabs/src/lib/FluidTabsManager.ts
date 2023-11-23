import { type IUserOptions } from "animated-scroll-to";
import ScrollManager from "./ScrollManager";
import TabPanelManager from "./TabPanelManager";
import TabIndicatorManager from "./TabIndicatorManager";
import ownerWindow from "./utils/ownerWindow";

export interface FluidTabsManagerConstructorParams {
  value: any;
  switchThreshold?: number;
  tabIndicator: HTMLElement;
  tabPanels: HTMLElement;
  tabs: HTMLElement[];
  valueToIndex: Map<any, number>;
  disableScrollTimeline?: boolean;

  /**
   * Setter to control the current active tab.
   */
  changeActiveTabCallback: (value: any) => void;

  /**
   * Customize on tab click scroll animation.
   * @see https://github.com/Stanko/animated-scroll-to#options
   */
  animateScrollToOptions?: IUserOptions;
}

export default class FluidTabsManager {
  public value: any;
  public tabs: HTMLElement[];
  public tabIndicator: HTMLElement;
  public valueToIndex: Map<any, number>;
  public canChangeTab = true;
  public canAnimateScrollToPanel = true;
  public changeActiveTabCallback: (value: any) => void;
  public switchThreshold: number;
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
      controller: this,
      element: tabPanels,
      animateScrollToOptions
    });

    this.tabIndicatorManager = new TabIndicatorManager({
      controller: this,
      element: tabIndicator,
      disableScrollTimeline,
    });

    this.scrollManager = new ScrollManager({
      scrollTarget: this.tabPanelManager.element,
      axis: "x",
      scrollHandler: this.tabIndicatorManager.scrollHandler,
    });

    this.win = ownerWindow(tabPanels);
    this.resizeHandler && this.win.addEventListener("resize", this.resizeHandler);

    if (typeof ResizeObserver !== "undefined" && this.resizeHandler) {
      this.resizeObserver = new ResizeObserver(this.resizeHandler);
      this.resizeObserver.observe(tabPanels);
    }

  }

  cleanup = () => {
    this.scrollManager.cleanup();
    this.resizeObserver?.disconnect();
    this.resizeHandler && this.win.removeEventListener("resize", this.resizeHandler);
  };

  getCurrentTab = () => {
    return this.tabs[this.valueToIndex.get(this.value)!];
  };

  getIndex = (value?: any) => {
    return this.valueToIndex.get(value ?? this.value)!;
  };

  resizeHandler = () => {
    this.tabIndicatorManager.resizeHandler();
    this.tabPanelManager.resizeHandler();
  };

  changeActiveTab = (value: any) => {
    if (this.canChangeTab) {
      this.changeActiveTabCallback(value);

      this.canAnimateScrollToPanel = false;
      this.canChangeTab = false;
    }
  }

  changeActivePanel = (value: any) => {
    this.value = value;
    this.canChangeTab = true;

    if (!this.canAnimateScrollToPanel) {
      this.canAnimateScrollToPanel = true;
      return;
    }

    this.canChangeTab = false;

    const index = this.getIndex(value);
    
    this.tabPanelManager.animateToPanel(index);
  };
}

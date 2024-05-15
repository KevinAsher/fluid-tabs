import { Direction } from "./utils";
import afterFrame from "./utils/afterFrame";

export interface ScrollManagerConstructorParams {
  scrollTarget: HTMLElement;
  axis: "x" | "y";
  scrollHandler?: (value?: any) => void;
}

export default class ScrollManager {
  private scrollTarget: HTMLElement;
  private previousScrollPosition = 0;
  private __updateScheduled = false;
  private axis;
  private scrollHandler?: (value?: any) => void;

  constructor({
    scrollTarget,
    axis = "x",
    scrollHandler,
  }: ScrollManagerConstructorParams) {
    this.scrollTarget = scrollTarget;
    this.axis = axis;
    this.scrollHandler = scrollHandler;

    this.scrollTarget.addEventListener("scroll", this.initialScrollHandler);
  }

  initialScrollHandler = () => {
    if (!this.__updateScheduled) {
      this.scheduleUpdate();
      this.__updateScheduled = true;
    }
  }

  getScrollPosition = () => {
    return this.axis === "x"
      ? this.scrollTarget.scrollLeft
      : this.scrollTarget.scrollTop;
  };

  getScrollDirection = () => {
    return this.previousScrollPosition <= this.getScrollPosition()
      ? this.axis === "x"
        ? Direction.RIGHT
        : Direction.UP
      : this.axis === "x"
        ? Direction.LEFT
        : Direction.DOWN;
  };

  hasScrolled = () => {
    return this.previousScrollPosition !== this.getScrollPosition();
  };

  scheduleUpdate = () => {
    afterFrame(() => {
      this.update();
    });
  };

  update = () => {
    if (this.hasScrolled()) {
      this.scrollHandler?.({ target: this.scrollTarget });
      this.previousScrollPosition = this.getScrollPosition();
      this.scheduleUpdate();
    } else {
      this.__updateScheduled = false;
    }
  };

  cleanup = () => {
    this.scrollHandler &&
      this.scrollTarget?.removeEventListener("scroll", this.initialScrollHandler);
  };
}

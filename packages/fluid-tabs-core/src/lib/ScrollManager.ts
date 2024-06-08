import { Direction } from "./utils";
import afterFrame from "./utils/afterFrame";

export default class ScrollManager {
  private scrollTarget: ScrollManagerConstructorParams["scrollTarget"];
  private previousScrollPosition = 0;
  private __updateScheduled = false;
  private axis: ScrollManagerConstructorParams["axis"] ;
  private scrollHandler: ScrollManagerConstructorParams["scrollHandler"];

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
  };

  getScrollPosition = () => {
    return this.axis === "x"
      ? this.scrollTarget.scrollLeft
      : this.scrollTarget.scrollTop;
  };

  getScrollTargetSize = () => {
    const { width, height } = this.scrollTarget.getBoundingClientRect();

    return this.axis === "x" ? width : height;
  };

  getRelativeScrollPosition = () => {
    return this.getScrollPosition() / this.getScrollTargetSize();
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
      // Scroll progress relative to the panel, e.g., 0.4 means we scrolled 40% of the first panel.
      // 1.2 means we scrolled 20% of the second panel, etc.
      this.scrollHandler?.(this.getRelativeScrollPosition());
      this.previousScrollPosition = this.getScrollPosition();
      this.scheduleUpdate();
    } else {
      this.__updateScheduled = false;
    }
  };

  cleanup = () => {
    this.scrollHandler &&
      this.scrollTarget?.removeEventListener(
        "scroll",
        this.initialScrollHandler,
      );
  };
}

export interface ScrollManagerConstructorParams {
  scrollTarget: HTMLElement;
  axis: "x" | "y";
  scrollHandler: (relativeScrollPosition: number) => void;
}

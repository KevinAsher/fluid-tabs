import { describe, it, expect } from "vitest";
import { render, screen, userEvent } from "../../../utils/test-utils";
import Direction from "../direction";
import getWorkingTabs from "../getWorkingTabs";
describe("getWorkingTabs", () => {
  describe("when previousTab is null", () => {
    it("currentTab and nextTab must be the same", () => {
      var { currentTab, nextTab } = getWorkingTabs({
        direction: Direction.LEFT,
        relativeScroll: 0,
        tabs: Array(4).fill(document.createElement("div")),
        previousTab: null,
        previousRelativeScroll: 0,
      });
      expect(currentTab).toBe(nextTab);

      var { currentTab, nextTab } = getWorkingTabs({
        direction: Direction.LEFT,
        relativeScroll: 0,
        tabs: Array(4).fill(document.createElement("div")),
        previousTab: null,
        previousRelativeScroll: 2,
      });
    });
  });
});

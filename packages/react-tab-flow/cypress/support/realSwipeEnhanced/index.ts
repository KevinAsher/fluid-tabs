import { fireCdpCommand } from "./fireCdpCommand";
import {
  getCypressElementCoordinates,
  Position,
  PositionCoordinates,
} from "./getCypressElementCoordinates";

export type SwipeDirection = "toLeft" | "toTop" | "toRight" | "toBottom";

export interface RealSwipeEnhancedOptions {
  /**
   * The point of the element where touch event will be executed
   * @example cy.realSwipe({ position: "topLeft" })
   */
  touchPosition?: Position;
  /** X coordinate to click, relative to the Element. Overrides `position`.
   * @example
   * cy.get("canvas").realSwipe({ x: 100, y: 115 })
   * cy.get("body").realSwipe({ x: 11, y: 12 }) // global touch by coordinates
   */
  x?: number;
  /**  X coordinate to click, relative to the Element. Overrides `position`.
   * @example
   * cy.get("canvas").realSwipe({ x: 100, y: 115 })
   * cy.get("body").realSwipe({ x: 11, y: 12 }) // global touch by coordinates
   */
  y?: number;
  /** Length of swipe (in pixels)
   * @default 50
   * @example
   * cy.get(".drawer").realSwipe("toLeft", { length: 50 })
   */
  distance?: number;
  /**
   * Swipe step (how often new touch move will be generated). Less more precise
   * ! Must be less than options.length
   * @default 10
   * cy.get(".drawer").realSwipe("toLeft", { step: 5 })
   */
  step?: number;

  wait?: number;


}

function buildMovementList(
  {
    distance,
    step,
    startPosition,
    direction,
  }: {
    distance: number;
    step: number;
    direction: SwipeDirection;
    startPosition: PositionCoordinates;
  },
) {

  const movementList: PositionCoordinates[] = [];

  const getPositionByDirection: Record<
    SwipeDirection,
    (step: number) => { x: number; y: number }
  > = {
    toTop: (step) => ({
      x: startPosition.x,
      y: startPosition.y - step,
    }),
    toBottom: (step) => ({
      x: startPosition.x,
      y: startPosition.y + step,
    }),
    toLeft: (step) => ({
      x: startPosition.x - step,
      y: startPosition.y,
    }),
    toRight: (step) => ({
      x: startPosition.x + step,
      y: startPosition.y,
    }),
  };

  for (let i = 0; i <= distance; i += step) {
    movementList.push(getPositionByDirection[direction](i));
  }

  return movementList;
}

interface Movement {
  direction: SwipeDirection,
  options: RealSwipeEnhancedOptions
}

export async function realSwipeEnhanced(
  subject: JQuery,
  movements: Movement[],
) {

  const log = Cypress.log({
    $el: subject,
    name: "realSwipe",
    consoleProps: () => ({
      "Applied To": subject.get(0),
    }),
  });

  log.snapshot("before");

  const options = movements[0].options;
  const position =
    options.x && options.y
      ? { x: options.x, y: options.y }
      : options.touchPosition;
  const startPosition = getCypressElementCoordinates(subject, position);
  await fireCdpCommand("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [startPosition],
  });
  
  let lastPosition: PositionCoordinates = startPosition;

  let movementList: PositionCoordinates[] = [];

  for (const movement of movements) {
    const options = movement.options;
    const direction = movement.direction;
    const position = 
      options.x && options.y
        ? { x: options.x, y: options.y }
        : options.touchPosition;

    const distance = options.distance || 10;
    const step = options.step || 10;

    movementList = [ 
      ...movementList, 
      ...buildMovementList({distance, step, direction, startPosition: lastPosition})
    ];

    lastPosition = movementList[movementList.length - 1];
  }
  console.log(movementList)

  for (const position of movementList) {
    await fireCdpCommand("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [position],
    })
  }

  await fireCdpCommand("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });

  log.snapshot("after").end();

  return subject;
}

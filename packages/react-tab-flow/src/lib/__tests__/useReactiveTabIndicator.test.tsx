import React, {useRef, useState} from 'react';
import { describe, it, expect, vi } from 'vitest'
import {render, screen, userEvent, fireEvent} from '../../utils/test-utils'
import {FluidTabs, FluidTabPanels, FluidTabPanel, useReactiveTabIndicator} from "../";
import { type IOptions, TCoords } from 'animated-scroll-to';

vi.mock('animated-scroll-to',() => {
  return {
    __esModule: true,
    default: (coords: TCoords, options: IOptions): Promise<boolean> => {
      // @ts-ignore
      options.elementToScroll.scrollLeft = coords[0];
      return Promise.resolve(true);
    }
  }
});



function App() {
  const tabPanelsRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const {
    tabIndicatorStyle,
    tabIndicatorRef,
    tabsRef
  } = useReactiveTabIndicator<HTMLDivElement>({ 
    value, 
    onChange: setValue, 
    tabPanelsRef,
    animateScrollToOptions: {
      minDuration: 1,
      maxDuration: 1,
    }
    // preemptive: true,
    // lockScrollWhenSwiping: true,
  });

  // function trackTab(node: any) {
  //   if (node) {
  //     tabsRef.current!.nodes.push(node);
  //     tabsRef.current!.valueToIndex.set(node);
  //     // console.log(node)
  //   }
  // }

  return (
    <>
      <div data-testid="tabs">
        <FluidTabs tabsRef={tabsRef} component="div">
          <button style={{width: 100}} onClick={() => setValue(0)}>Tab 1 {value === 0 ? 'selected' : ''}</button>
          <button style={{width: 50}} onClick={() => setValue(1)}>Tab 2 {value === 1 ? 'selected' : ''}</button>
          <button style={{width: 100}} onClick={() => setValue(2)}>Tab 3 {value === 2 ? 'selected' : ''}</button>
        </FluidTabs>
        <div data-testid="indicator" ref={tabIndicatorRef} style={tabIndicatorStyle}></div>
      </div>
      <div data-testid="panels" ref={tabPanelsRef} style={{width: 300}}>
        <div style={{width: 100}}>Panel 1</div>
        <div style={{width: 100}}>Panel 2</div>
        <div style={{width: 100}}>Panel 3</div>
      </div>
    </>
  )
}

 // @ts-ignore
const sleep = (ms) => new Promise((res, rej) => setTimeout(res, ms))

describe('useReactiveTabIndicator', () => {
  beforeAll(() => {
    // @ts-ignore
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => cb())

    vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return {
        // @ts-ignore
        width: parseFloat(this.style.width) || 0,
        height: 0,
        x: 0,
        y: 0,
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        toJSON: () => {}
      }
    })

    vi.spyOn(window.HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function() {
      // @ts-ignore
      return parseFloat(this.style.width) || 0
    })

  })

  afterAll(() => {
    // @ts-ignore
    window.requestAnimationFrame.mockRestore();
  })

  it("renders without error", () => {
    render(<App />);
  })

  it("renders without error 2", async () => {
    render(<App />);
    const tab = screen.getByText(/Tab 3/);
    expect(tab).toBeInTheDocument();
    userEvent.click(tab);
    expect(await screen.findByText(/Tab 3 selected/)).toBeInTheDocument();
    const panels = screen.getByTestId(/panels/);
    expect(panels).toBeInTheDocument();
    expect(panels.scrollLeft).toBe(600);

    const scrollPoints = [500, 504, 508, 510, 520, 540, 550];

    scrollPoints.forEach(point => {
      fireEvent.scroll(panels, {target: {scrollLeft: point}});
    })

    // await sleep(1000);
    screen.debug();
    // expect(await screen.getByTestId(/panels/)).toBeInTheDocument();
  })
})



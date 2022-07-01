import React, { useState, useEffect } from 'react';
import useWindowSize from './useWindowSize';

/*
  Only read the client width of the initialization and window
  width update (most likely screen orientation change).
  TODO: should we use ResizeObserver ?
*/

export default function useElementWidth(elementRef: React.RefObject<HTMLElement>) {
  const [elementClientWidth, setElementClientWidth] = useState<number>();
  const { width } = useWindowSize();

  useEffect(() => {
    setElementClientWidth(elementRef.current!.getBoundingClientRect().width);
  }, [width, elementRef]);

  return elementClientWidth;
}
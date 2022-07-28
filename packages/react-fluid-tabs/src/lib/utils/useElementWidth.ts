import { useState, useEffect } from 'react';
import ownerWindow from './ownerWindow';

export default function useElementWidth(domElement: HTMLElement | null) {
  const [domElementWidth, setDomElementWidth] = useState<number>(0);

   useEffect(() => {
    if (!domElement) return;

    function handleResize() {
      if (domElement) {
        setDomElementWidth(domElement.getBoundingClientRect().width);
      }
    }

    const win = ownerWindow(domElement);
    win.addEventListener('resize', handleResize);

    let resizeObserver: ResizeObserver;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(domElement);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      win.removeEventListener("resize", handleResize);
    };
  }, [domElement]);

  return domElementWidth;
}
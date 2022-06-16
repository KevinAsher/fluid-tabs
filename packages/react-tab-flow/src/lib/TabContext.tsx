import React from 'react';
import useReactTabIndicator from './useReactiveTabIndicator';

interface RenderProps {
  index: string;
  setIndex: (index: string) => void
} 

interface Props {
  children: (props: RenderProps) => React.ReactNode;
} 

export const LocalTabContext = React.createContext({});

export default function TabContext({children}: Props) {
  const tabPanelsRef = React.useRef(null);

  const tabRefs = React.useRef<HTMLElement[]>([]);
  const addToRefs = React.useCallback((el: HTMLElement | null) => {
    if (el && !tabRefs.current.includes(el)) {
      tabRefs.current.push(el);
    }
  }, [tabRefs]);

  const {
    tabIndicatorWidth,
    index,
    setIndex
  } = useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef, defaultIndex: 1, preemptive: true});

  return (
    <LocalTabContext.Provider value={{tabPanelsRef, tabRefs, addToRefs}}>
      {children({index, setIndex})}
    </LocalTabContext.Provider>
  )
}
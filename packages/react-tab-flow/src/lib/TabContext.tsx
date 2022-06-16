import React from 'react';


interface Props {
  children: React.ReactNode;
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

  return (
    <LocalTabContext.Provider value={{tabPanelsRef, tabRefs, addToRefs}}>
      {children}
    </LocalTabContext.Provider>
  )
}
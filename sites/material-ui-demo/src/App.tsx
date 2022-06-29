// @ts-nocheck
import React, { useState, useRef } from "react";
// import { Tabs, Tab, createMuiTheme } from "@material-ui/core";
import { Tabs, Tab, createMuiTheme } from "@mui/material";
// import { ThemeProvider } from "@material-ui/styles";
import { ThemeProvider, useThemeProps } from "@mui/material/styles";
import styled from "styled-components";
import tabs from "./data";
import { useReactiveTabIndicator, FluidTabPanel, FluidTabPanels, FluidTabs, FluidTabList } from 'react-tab-flow';
import { BrowserRouter, Routes, Route, Link, useMatch, useNavigate, Navigate } from "react-router-dom";
import 'react-tab-flow/style.css'

const Line = styled.div`
  height: 1rem;
  margin-bottom: 0.5rem;
  background-color: hsla(0, 0%, 0%, 0.09);
  width: ${(props) => props.width || "100%"};
`;
const ContentContainer = styled.div`
  padding: 1rem;
  padding-top: 0;
`;

const StyledTabPanels = styled.div`
  /* width: 100vw; */
  scroll-snap-type: x mandatory;
  display: flex;
  -webkit-overflow-scrolling: touch;
  // scroll-snap-stop: always;
  overflow-x: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledTabPanel = styled.div`
  /* min-width: 100vw; */
  min-width: 100%;
  min-height: 10rem;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  &[hidden] {
    display: block !important;
  }
  &:focus {
    outline: none;
  }
`;

const StyledContent = styled.div`
  h1 {
    font-size: 1.5rem;
    margin: 1rem 0 1rem 0;
    font-weight: bold;
    font-family: "Source Sans Pro", -apple-system, system-ui, BlinkMacSystemFont,
      "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
  }
  img {
    width: 100%;
    height: 15rem;
    object-fit: cover;
  }
`;

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#000000"
    },
    secondary: {
      main: "#888888"
    }
  }
});

const StyledTabPanelContent = React.memo(({ img, title }) => {
  return (
    <StyledContent>
      {[0,1,2].map(key => 
        <div key={key}>
          <img src={img} alt="landscape" draggable="false" />
          <ContentContainer>
            <h1>{title}</h1>
            <div style={{ marginBottom: "1.25rem" }}>
              {[...new Array(4).keys()].map((i) => {
                return <Line width={i === 3 ? "50%" : "100%"} key={i} />;
              })}
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              {[...new Array(3).keys()].map((i) => {
                return <Line width={i === 2 ? "33%" : "100%"} key={i} />;
              })}
            </div>
            <div>
              {[...new Array(2).keys()].map((i) => {
                return <Line width={i === 1 ? "80%" : "100%"} key={i} />;
              })}
            </div>
          </ContentContainer>
        </div>
      )}
    </StyledContent>
  );
});

const CustomTabIndicator = styled.div`
  width: 100%;
  height: 2px;
  background: #000;
  position: absolute;
  bottom: 0;
`;

const CustomTabsRoot = styled.div`
  position: absolute;
  position: relative; 
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
  position: sticky;
  top: 0;
  background: #fff;
`;

const CustomTab = React.forwardRef(({label, selected, value, onChange}, ref) => {
  return (
    <button
      ref={ref}
      onClick={() => onChange(value)}
      style={{
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        textTransform: 'uppercase',
        color: selected ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.5)', 
        margin: 0,
        border: 'none',
        background: 'none', 
        minWidth: 90,
        padding: '8px 16px', 
        height: 50,
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
      >
      {label}
    </button>
  )
})


const CustomTabs = React.forwardRef(({children, value, onChange, tabIndicatorProps}, ref) => {
  const childrenWithProps = React.Children.map(
    children, (child, index) => React.cloneElement(child, {
      selected: (child.props.value || index) == value,
      value: child.props.value || index,
      onChange
    })
  )

  return (
    <CustomTabsRoot ref={ref} >
      <div style={{display: 'flex', whiteSpace: 'nowrap',  }}>
        {childrenWithProps}
      </div>
      <CustomTabIndicator {...tabIndicatorProps}/>
    </CustomTabsRoot>
  )
})


const TabsMemo = React.memo(Tabs);
const TabMemo = React.memo(Tab);

const CustomTabMemo = React.memo(CustomTab);
const CustomTabsMemo = React.memo(CustomTabs);

function AppCustomTabs({tabPanelsRef, children}) {
  const [value, setValue] = useState(1);
  const {
    tabIndicatorStyles,
    tabIndicatorRef,
    tabsRef
  } = useReactiveTabIndicator({ value, setValue, preemptive: true, tabPanelsRef });

  const tabIndicatorStyle = {
    ...tabIndicatorStyles,
    left: 0,
    transition: "none",
    willChange: "transform, width",
    transformOrigin: "left 50% 0"
  };

  let tabIndicatorProps = React.useMemo(() => ({
    ref: tabIndicatorRef,
    style: tabIndicatorStyle
  }), [tabIndicatorStyles]);

  return (
    <FluidTabList 
      component={CustomTabsMemo} 
      onChange={setValue} 
      value={value} 
      tabIndicatorProps={tabIndicatorProps} 
      tabsRef={tabsRef}>
      {children}
    </FluidTabList>
  );
}

function AppMuiTabs({tabPanelsRef, children}) {
  const routeMatch = useMatch({
    path: '/:tab',
    end: true,
    caseSensitive: true
  });

  const navigate = useNavigate();
  // const [value, setValue] = useState(1);
  const {
    tabIndicatorStyles,
    tabIndicatorRef,
    tabsRef
  } = useReactiveTabIndicator({ 
    value: routeMatch.params.tab, 
    setValue: (val) => navigate(`./${val}`), 
    tabPanelsRef,
    preemptive: true,
    lockScrollWhenSwiping: true,
  });

  const onChange = React.useCallback((e, val) => {
    setValue(val);
  }, []);

  const tabIndicatorStyle = {
    ...tabIndicatorStyles,
    left: 0,
    transition: "none",
    willChange: "transform, width",
    transformOrigin: "left 50% 0"
  };

  let tabIndicatorProps = React.useMemo(() => ({
    ref: tabIndicatorRef,
    style: tabIndicatorStyle
  }), [tabIndicatorStyles]);

  return (
    <FluidTabList 
      component={TabsMemo} 
      // onChange={onChange}
      value={routeMatch.params.tab || 'p'} 
      TabIndicatorProps={tabIndicatorProps} 
      variant="scrollable"
      scrollButtons={false}
      tabsRef={tabsRef}>
      {children}
    </FluidTabList>
  );
}



function AppInner() {
  const tabPanelsRef = React.useRef(null);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        {/* <AppCustomTabs tabPanelsRef={tabPanelsRef}>
          <CustomTabMemo label="Tranquil Forrest" key="1" />
          <CustomTabMemo label="P" key="2" />
          <CustomTabMemo label="Vibrant Beach" key="3" />
          <CustomTabMemo label="Hidden Waterfall" key="4" />
        </AppCustomTabs> */}
        <AppMuiTabs tabPanelsRef={tabPanelsRef}>
          <TabMemo component={Link} to="/tranquil-forest" value="tranquil-forest" label="Tranquil Forrest" key="1" />
          <TabMemo component={Link} to="/p" value="p" label="P" key="2" />
          <TabMemo component={Link} to="/vibrant-beach" value="vibrant-beach" label="Vibrant Beach" key="3" />
          <TabMemo component={Link} to="/hidden-waterfall" value="hidden-waterfall" label="Hidden Waterfall" key="4" />
        </AppMuiTabs>
        <FluidTabPanels ref={tabPanelsRef}>
            {tabs.map(({ img, title }, i) =>
              <Routes>
                <Route 
                  path={"*"} 
                  element={
                    <FluidTabPanel>
                      <StyledTabPanelContent img={img} title={title} />
                    </FluidTabPanel>
                  }
                  />
              </Routes>
            )}
        </FluidTabPanels>
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/p" />} /> 
        <Route path="*" element={<AppInner />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App

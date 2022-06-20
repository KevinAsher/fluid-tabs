// @ts-nocheck
import React, { useState, useRef } from "react";
// import { Tabs, Tab, createMuiTheme } from "@material-ui/core";
import { Tabs, Tab, createMuiTheme } from "@mui/material";
// import { ThemeProvider } from "@material-ui/styles";
import { ThemeProvider } from "@mui/material/styles";
import styled from "styled-components";
import tabs from "./data";
import { useReactiveTabIndicator, FluidTabPanel, FluidTabPanels, FluidTabs, FluidTabList } from 'react-tab-flow';
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

const TabsMemo = React.memo(Tabs);
const TabMemo = React.memo(Tab);

function AppTabs({tabPanelsRef, children}) {
  const [index, setIndex] = useState(1);
  const {
    tabIndicatorWidth,
    tabIndicatorRef,
    tabRefs
  } = useReactiveTabIndicator({ index, setIndex, preemptive: true, tabPanelsRef });

  const onChange = React.useCallback((e, val) => {
    setIndex(val);
  }, []);

  const tabIndicatorStyle = {
    left: 0,
    width: tabIndicatorWidth,
    transition: "none",
    willChange: "transform, width",
    transformOrigin: "left 50% 0"
  };

  let tabIndicatorProps = React.useMemo(() => ({
    ref: tabIndicatorRef,
    style: tabIndicatorStyle
  }), [tabIndicatorWidth]);


  return (
      <FluidTabList
        component={TabsMemo}
        value={index}
        TabIndicatorProps={tabIndicatorProps}
        onChange={onChange}
        tabRefs={tabRefs}
        variant="scrollable"
        scrollButtons={false}
      >
        {children}
      </FluidTabList>
  )
}

function App() {
  const tabPanelsRef = React.useRef(null);


  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <AppTabs tabPanelsRef={tabPanelsRef}>
          <TabMemo label="Tranquil Forrest" key="1" />
          <TabMemo label="P" key="2" />
          <TabMemo label="Vibrant Beach" key="3" />
          <TabMemo label="Hidden Waterfall" key="4" />
        </AppTabs>
        <FluidTabPanels ref={tabPanelsRef}>
          {tabs.map(({ img, title }, i) =>
            <FluidTabPanel key={i}>
              <StyledTabPanelContent img={img} title={title} />
            </FluidTabPanel>
          )}
        </FluidTabPanels>
      </div>
    </ThemeProvider>
  );
}

export default App

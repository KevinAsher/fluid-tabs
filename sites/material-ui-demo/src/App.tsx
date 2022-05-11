// @ts-nocheck
import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { Tabs, Tab, createMuiTheme } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";
import styled from "styled-components";
import tabs from "./data";
import { useReactiveTabIndicator, useWindowSize } from 'react-tab-flow';

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
  scroll-snap-stop: always;
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

const styles = {
  tabs: {
    background: "#fff"
  },
  slide: {
    padding: 15,
    minHeight: 100,
    color: "#fff"
  },
  slide1: {
    backgroundColor: "#FEA900"
  },
  slide2: {
    backgroundColor: "#B3DC4A"
  },
  slide3: {
    backgroundColor: "#6AC0FF"
  },
  slide4: {
    backgroundColor: "#e980ff"
  }
};

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
      <img src={img} alt="landscape" draggable="false" />
      <ContentContainer>
        <h1>{title}</h1>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(4).keys()].map((i) => {
            return <Line width={i === 3 ? "50%" : "100%"} />;
          })}
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(3).keys()].map((i) => {
            return <Line width={i === 2 ? "33%" : "100%"} />;
          })}
        </div>
        <div>
          {[...new Array(2).keys()].map((i) => {
            return <Line width={i === 1 ? "80%" : "100%"} />;
          })}
        </div>
      </ContentContainer>
      <img src={img} alt="landscape" draggable="false" />
      <ContentContainer>
        <h1>{title}</h1>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(4).keys()].map((i) => {
            return <Line width={i === 3 ? "50%" : "100%"} />;
          })}
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(3).keys()].map((i) => {
            return <Line width={i === 2 ? "33%" : "100%"} />;
          })}
        </div>
        <div>
          {[...new Array(2).keys()].map((i) => {
            return <Line width={i === 1 ? "80%" : "100%"} />;
          })}
        </div>
      </ContentContainer>
      <img src={img} alt="landscape" draggable="false" />
      <ContentContainer>
        <h1>{title}</h1>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(4).keys()].map((i) => {
            return <Line width={i === 3 ? "50%" : "100%"} />;
          })}
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          {[...new Array(3).keys()].map((i) => {
            return <Line width={i === 2 ? "33%" : "100%"} />;
          })}
        </div>
        <div>
          {[...new Array(2).keys()].map((i) => {
            return <Line width={i === 1 ? "80%" : "100%"} />;
          })}
        </div>
      </ContentContainer>
    </StyledContent>
  );
});

function App() {
  const tabPanelsRef = React.useRef(null);
  const tabPanelsScrollWidthRef = React.useRef(null);
  const tabIndicatorRef = React.useRef(null);
  const { width } = useWindowSize();
  const tabsActionRef = React.useRef(null);


  const arrLength = tabs.length;
  const panelRefs = React.useRef([]);
  const tabRefs = React.useRef([]);

  const {
    tabIndicatorWidth,
    index,
    setIndex,
    startAnimation
  } = useReactiveTabIndicator({ tabRefs, tabPanelsRef, tabIndicatorRef });

  const addToRefs = (arrRefs) => (el) => {
    if (el && !arrRefs.current.includes(el)) {
      arrRefs.current.push(el);
    }
  };

  React.useEffect(() => {
    tabPanelsScrollWidthRef.current = tabPanelsRef.current.scrollWidth;
  }, [width]);

  const onChange = (e, i) => {
    setIndex(i);
  };

  let tabIndicatorStyle = {
    left: 0,
    transition: "none",

    // transition: "translate 0.15s ease-in",
    willChange: "transform, width",
    transformOrigin: "left 50% 0"
  };

  if (tabIndicatorWidth) {
    tabIndicatorStyle = { ...tabIndicatorStyle, width: tabIndicatorWidth };
  }

  const onChangeCallback = React.useCallback((e, val) => onChange(e, val), []);

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <div>
          <Tabs
            action={tabsActionRef}
            value={index}
            variant="scrollable"
            TabIndicatorProps={{
              ref: tabIndicatorRef,
              style: tabIndicatorStyle
            }}
            onChange={onChangeCallback}
          >
            {tabs.map(({ img, title }, i) => (
              <Tab label={title} ref={addToRefs(tabRefs)} />
            ))}
          </Tabs>
          <StyledTabPanels
            ref={tabPanelsRef}
          // onScroll={(e) => {
          //   // const t0 = performance.now();
          //   startAnimation(e.target.scrollLeft);
          //   // const t1 = performance.now();
          //   // console.log(`onScrollChanged took ${t1 - t0}ms`);
          // }}
          >
            {tabs.map(({ img, title }, i) => {
              return (
                <StyledTabPanel ref={addToRefs(panelRefs)} key={i}>
                  <StyledTabPanelContent img={img} title={title} />
                </StyledTabPanel>
              );
            })}
          </StyledTabPanels>
          {/* <SwipeableViews
            enableMouseEvents
            index={index}
            onSwitching={(i, type) => {
              setFineIndex(i);
              if (type === "end") {
                onChange(i);
              }
            }}
          >
            <div style={{ ...styles.slide, ...styles.slide1 }}>slide n°1</div>
            <div style={{ ...styles.slide, ...styles.slide2 }}>slide n°2</div>
            <div style={{ ...styles.slide, ...styles.slide3 }}>slide n°3</div>
            <div style={{ ...styles.slide, ...styles.slide4 }}>slide n°4</div>
          </SwipeableViews> */}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App

// @ts-nocheck
import React, { useState, useRef } from "react";
// import { Tabs, Tab, createMuiTheme } from "@material-ui/core";
import { Tabs, Tab, createMuiTheme, ButtonBase } from "@mui/material";
// import { ThemeProvider } from "@material-ui/styles";
import { ThemeProvider, useThemeProps } from "@mui/material/styles";
import styled from "styled-components";
import tabs from "./data";
import {
  useReactiveTabIndicator,
  useTabPanelsRef,
  FluidTabPanel,
  FluidTabPanels,
  FluidTabs,
} from "@fluid-tabs/react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useMatch,
  useNavigate,
  Navigate,
  useResolvedPath,
  useParams,
  useLocation,
} from "react-router-dom";

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

const StyledContent = styled.div`
  h1 {
    font-size: 1.5rem;
    margin: 1rem 0 1rem 0;
    font-weight: bold;
    font-family:
      "Source Sans Pro",
      -apple-system,
      system-ui,
      BlinkMacSystemFont,
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      Arial,
      sans-serif;
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
      main: "#000000",
    },
    secondary: {
      main: "#888888",
    },
  },
});

const StyledTabPanelContent = React.memo(({ img, title }) => {
  return (
    <StyledContent>
      {[0, 1, 2].map((key) => (
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
      ))}
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

const CustomTab = React.forwardRef(
  (
    {
      label,
      selected,
      value,
      onChange,
      style,
      component: Component = "button",
      ...other
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        onClick={() => onChange?.(value)}
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          textTransform: "uppercase",
          color: selected ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.5)",
          margin: 0,
          border: "none",
          background: "none",
          minWidth: 90,
          padding: "8px 16px",
          height: 50,
          whiteSpace: "nowrap",
          flexShrink: 0,
          textDecoration: "none",
          letterSpacing: "0.02857em",
          fontSize: "0.875rem",
          // marginLeft: 40,
          // marginRight: 40,
          ...style,
        }}
        {...other}
      >
        {label}
      </Component>
    );
  },
);

const CustomTabs = React.forwardRef(
  ({ children, value, onChange, tabIndicatorProps }, ref) => {
    const childrenWithProps = React.Children.map(children, (child, index) =>
      React.cloneElement(child, {
        selected: (child.props.value || index) == value,
        value: child.props.value || index,
        onChange,
      }),
    );

    return (
      <CustomTabsRoot ref={ref}>
        <div style={{ display: "flex", whiteSpace: "nowrap" }}>
          {childrenWithProps}
        </div>
        <CustomTabIndicator {...tabIndicatorProps} />
      </CustomTabsRoot>
    );
  },
);

const TabsMemo = React.memo(Tabs);
const TabMemo = React.memo(Tab);

const CustomTabMemo = React.memo(CustomTab);
const CustomTabsMemo = React.memo(CustomTabs);

function AppCustomTabs({ tabPanels, children }) {
  // const routeMatch = useMatch({
  //   path: '/:tab',
  //   end: true,
  //   caseSensitive: true
  // });

  // const navigate = useNavigate();
  const [value, setValue] = useState(1);
  const { tabIndicatorProps, tabsRef } = useReactiveTabIndicator({
    value,
    onChange: setValue,
    // value: routeMatch.params.tab,
    // onChange: (val) => navigate(`./${val}`),
    tabPanels,
  });

  return (
    <FluidTabs
      component={CustomTabsMemo}
      onChange={setValue}
      value={value}
      // value={routeMatch.params.tab}
      tabIndicatorProps={tabIndicatorProps}
      tabsRef={tabsRef}
    >
      {children}
    </FluidTabs>
  );
}

function AppCustomTabsWithRoutes({ tabPanels, children }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { tabIndicatorProps, tabsRef } = useReactiveTabIndicator({
    value: tab,
    onChange: (val) => {
      navigate(`../${val}`);
    },
    tabPanels,
  });

  return (
    <FluidTabs
      component={CustomTabsMemo}
      value={tab}
      tabIndicatorProps={tabIndicatorProps}
      tabsRef={tabsRef}
    >
      {children}
    </FluidTabs>
  );
}

function AppMuiTabs({ tabPanels, children }) {
  // const routeMatch = useMatch({
  //   path: '/:tab',
  //   end: true,
  //   caseSensitive: true
  // });

  // const navigate = useNavigate();
  const [value, setValue] = useState(1);
  const { tabIndicatorProps, tabsRef } = useReactiveTabIndicator({
    // value: routeMatch.params.tab,
    // onChange: (val) => navigate(`./${val}`),
    value,
    onChange: setValue,
    tabPanels,
  });

  const onChange = React.useCallback((e, val) => {
    setValue(val);
  }, []);

  return (
    <FluidTabs
      component={TabsMemo}
      onChange={onChange}
      value={value}
      // value={routeMatch.params.tab}
      TabIndicatorProps={tabIndicatorProps}
      variant="scrollable"
      scrollButtons={false}
      tabsRef={tabsRef}
    >
      {children}
    </FluidTabs>
  );
}

function AppMuiTabsWithRoutes({ tabPanels, children }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { tabIndicatorProps, tabsRef } = useReactiveTabIndicator({
    value: tab,
    onChange: (val) => {
      navigate(`../${val}`);
    },
    tabPanels,
  });

  return (
    <FluidTabs
      component={TabsMemo}
      value={tab}
      TabIndicatorProps={tabIndicatorProps}
      variant="scrollable"
      scrollButtons={false}
      tabsRef={tabsRef}
    >
      {children}
    </FluidTabs>
  );
}

const AppCustomTabsWithRoutesDemo = ({ tabPanels }) => {
  return (
    <AppCustomTabsWithRoutes tabPanels={tabPanels}>
      <CustomTabMemo
        component={Link}
        to="tranquil-forest"
        value="tranquil-forest"
        label="Tranquil Forrest"
        key="1"
      />
      <CustomTabMemo component={Link} to="p" value="p" label="P" key="2" />
      <CustomTabMemo
        component={Link}
        to="vibrant-beach"
        value="vibrant-beach"
        label="Vibrant Beach"
        key="3"
      />
      <CustomTabMemo
        component={Link}
        to="hidden-waterfall"
        value="hidden-waterfall"
        label="Hidden Waterfall"
        key="4"
      />
    </AppCustomTabsWithRoutes>
  );
};

function AppInner() {
  const { tabPanels, setTabPanelsRef } = useTabPanelsRef();

  return (
    <div className="App">
      <Routes>
        <Route
          path="/custom-tabs"
          element={
            <AppCustomTabs tabPanels={tabPanels}>
              <CustomTabMemo
                component={ButtonBase}
                label="Tranquil Forrest"
                key="1"
              />
              <CustomTabMemo component={ButtonBase} label="P" key="2" />
              <CustomTabMemo
                component={ButtonBase}
                label="Vibrant Beach"
                key="3"
              />
              <CustomTabMemo
                component={ButtonBase}
                label="Hidden Waterfall"
                key="4"
              />
            </AppCustomTabs>
          }
        />
        <Route
          path="/mui-tabs"
          element={
            <AppMuiTabs tabPanels={tabPanels}>
              <TabMemo label="Tranquil Forrest" key="1" />
              <TabMemo label="P" key="2" />
              <TabMemo label="Vibrant Beach" key="3" />
              <TabMemo label="Hidden Waterfall" key="4" />
            </AppMuiTabs>
          }
        />
        <Route path="/routes-custom-tabs/*">
          <Route index element={<Navigate to="./p" />} />
          <Route
            path=":tab"
            element={
              <AppCustomTabsWithRoutes tabPanels={tabPanels}>
                <CustomTabMemo
                  component={Link}
                  to="../tranquil-forest"
                  value="tranquil-forest"
                  label="Tranquil Forrest"
                  key="1"
                />
                <CustomTabMemo
                  component={Link}
                  to="../p"
                  value="p"
                  label="P"
                  key="2"
                />
                <CustomTabMemo
                  component={Link}
                  to="../vibrant-beach"
                  value="vibrant-beach"
                  label="Vibrant Beach"
                  key="3"
                />
                <CustomTabMemo
                  component={Link}
                  to="../hidden-waterfall"
                  value="hidden-waterfall"
                  label="Hidden Waterfall"
                  key="4"
                />
              </AppCustomTabsWithRoutes>
            }
          />
        </Route>
        <Route path="/routes-mui-tabs/*">
          <Route index element={<Navigate to="./p" />} />
          <Route
            path=":tab"
            element={
              <AppMuiTabsWithRoutes tabPanels={tabPanels}>
                <TabMemo
                  component={Link}
                  to="../tranquil-forest"
                  value="tranquil-forest"
                  label="Tranquil Forrest"
                  key="1"
                />
                <TabMemo
                  component={Link}
                  to="../p"
                  value="p"
                  label="P"
                  key="2"
                />
                <TabMemo
                  component={Link}
                  to="../vibrant-beach"
                  value="vibrant-beach"
                  label="Vibrant Beach"
                  key="3"
                />
                <TabMemo
                  component={Link}
                  to="../hidden-waterfall"
                  value="hidden-waterfall"
                  label="Hidden Waterfall"
                  key="4"
                />
              </AppMuiTabsWithRoutes>
            }
          />
        </Route>
      </Routes>
      {/* <AppMuiTabsWithRoutes tabPanels={tabPanels}>
          <TabMemo component={Link} to="/tranquil-forest" value="tranquil-forest" label="Tranquil Forrest" />
          <TabMemo component={Link} to="/p" value="p" label="P" />
          <TabMemo component={Link} to="/vibrant-beach" value="vibrant-beach" label="Vibrant Beach" />
          <TabMemo component={Link} to="/hidden-waterfall" value="hidden-waterfall" label="Hidden Waterfall" />
        </AppMuiTabsWithRoutes> */}
      {/* <AppMuiTabs tabPanels={tabPanels}>
          <TabMemo label="Tranquil Forrest" key="1" />
          <TabMemo label="P" key="2" />
          <TabMemo label="Vibrant Beach" key="3" />
          <TabMemo label="Hidden Waterfall" key="4" />
        </AppMuiTabs> */}
      <FluidTabPanels ref={setTabPanelsRef} id="scrollable-container">
        {tabs.map(
          ({ img, title }, i) => (
            // <Routes>
            //   <Route
            //     path={"*"}
            //     element={
            <FluidTabPanel key={i}>
              <StyledTabPanelContent img={img} title={title} />
            </FluidTabPanel>
          ),
          //     }
          //     />
          // </Routes>
        )}
      </FluidTabPanels>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/custom-tabs" />} />
          <Route path="*" element={<AppInner />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

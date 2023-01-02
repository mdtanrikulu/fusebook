import React, { useEffect, useState } from 'react';
import styled, { css, ThemeProvider } from 'styled-components';
import {
  ThorinGlobalStyles,
  lightTheme,
  Card,
  FieldSet,
  Checkbox,
  Heading,
  Toast,
  Typography,
} from '@ensdomains/thorin';
import InteractiveView from './Interactive';
import './App.css';

const Grid = styled.div(
  () => css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    box-sizing: border-box;
    gap: 50px;
    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  `
);

const Panel = styled.div(
  () => css`
    box-sizing: border-box;
    margin-top: 780px;
    height: 1000px;
  `
);

const Rail = styled.div(
  () => css`
    height: 4000px;
    position: relative;
    margin-bottom: 100px;
  `
);

const Container = styled.div(
  ({ theme }) => css`
    display: block;
    padding: ${theme.space['6']};
    display: block;
    justify-content: center;
    margin: 0 auto;
    max-width: ${theme.space['640']};
    min-height: ${theme.space['viewHeight']};
  `
);

const InnerContainer = styled.div(
  ({ theme }) => css`
    padding: ${theme.space['9']} 0;
  `
);

const fusesDict = Object.freeze({
  CANNOT_BURN_FUSES: 'CANNOT_BURN_FUSES',
  CANNOT_CREATE_SUBDOMAIN: 'CANNOT_CREATE_SUBDOMAIN',
  CANNOT_TRANSFER: 'CANNOT_TRANSFER',
  CANNOT_SET_RESOLVER: 'CANNOT_SET_RESOLVER',
  CANNOT_SET_TTL: 'CANNOT_SET_TTL',
  CANNOT_UNWRAP: 'CANNOT_UNWRAP',
  PARENT_CANNOT_CONTROL: 'PARENT_CANNOT_CONTROL',
});

function checkParent(parentFuses, childFuse) {
  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL } = fusesDict;

  if (childFuse === PARENT_CANNOT_CONTROL) {
    return parentFuses.has(CANNOT_UNWRAP);
  }
}

function checkSelf(fuses, fuse) {
  const {
    CANNOT_BURN_FUSES,
    CANNOT_CREATE_SUBDOMAIN,
    CANNOT_TRANSFER,
    CANNOT_SET_RESOLVER,
    CANNOT_SET_TTL,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;

  if (fuse === CANNOT_UNWRAP) {
    return fuses.has(PARENT_CANNOT_CONTROL);
  }
  if (
    // user fuses
    fuse == CANNOT_TRANSFER ||
    fuse === CANNOT_SET_RESOLVER ||
    fuse === CANNOT_SET_TTL
  ) {
    return fuses.has(CANNOT_UNWRAP) && !fuses.has(CANNOT_BURN_FUSES);
  }
  if (fuse === CANNOT_BURN_FUSES) {
    return fuses.has(CANNOT_UNWRAP) && fuses.has(PARENT_CANNOT_CONTROL);
  }
  if (fuse === CANNOT_CREATE_SUBDOMAIN) {
    return (
      fuses.has(CANNOT_UNWRAP) &&
      fuses.has(PARENT_CANNOT_CONTROL) &&
      !fuses.has(CANNOT_BURN_FUSES)
    );
  }
}

function generateTable(parentFuses, childFuses) {
  const {
    CANNOT_BURN_FUSES,
    CANNOT_CREATE_SUBDOMAIN,
    CANNOT_TRANSFER,
    CANNOT_SET_RESOLVER,
    CANNOT_SET_TTL,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;

  const methods = {
    wrapETH2LD: [1, 0],
    registerAndWrapETH2LD: [1, 0],
    wrap: [1, 1],
    setChildFuses: [1, 1],
    setSubnodeOwner: [1, 1],
    setSubnodeRecord: [1, 1],
    setResolver: [1, 1],
    setTTL: [1, 1],
    setRecord: [1, 1],
    setFuses: [1, 1],
    safeTransferFrom: [1, 1],
    safeBatchTransferFrom: [1, 1],
    renew: [1, 1],
    unwrapETH2LD: [1, 0],
    unwrap: [1, 1],
  };

  const states = [
    { backgroundColor: 'white', color: 'black' },
    { backgroundColor: 'rgb(73, 179, 147)', color: 'white' }, // green
    { backgroundColor: 'rgb(213, 85, 85)', color: 'white' }, // red
  ];
  const conditions = (fuses, child, key) => {
    if (key === '-') return states[0];
    if (key === 'renew') return states[1];
    if (
      ['setSubnodeRecord', 'setSubnodeOwner', 'setChildFuses'].includes(key)
    ) {
      if (['setSubnodeRecord', 'setSubnodeOwner'].includes(key)) {
        if (fuses.has(CANNOT_CREATE_SUBDOMAIN)) {
          return states[2];
        }
      }
      if (child && child.has(PARENT_CANNOT_CONTROL)) {
        return states[2];
      }
      if (
        key === 'setSubnodeRecord' &&
        (fuses.has(CANNOT_SET_TTL) || fuses.has(CANNOT_SET_RESOLVER))
      ) {
        return states[2];
      }
      return states[1];
    }
    if (key === 'unwrap' || key == 'unwrapETH2LD') {
      if (fuses.has(CANNOT_UNWRAP)) {
        return states[2];
      }
      return states[1];
    }
    if (['safeBatchTransferFrom', 'safeTransferFrom'].includes(key)) {
      if (fuses.has(CANNOT_TRANSFER)) {
        return states[2];
      }
      return states[1];
    }

    if (key === 'setResolver') {
      if (!fuses.has(CANNOT_UNWRAP) || fuses.has(CANNOT_SET_RESOLVER)) {
        return states[2];
      }
      return states[1];
    }

    if (key === 'setFuses' || key === 'setRecord' || key === 'setTTL') {
      if (fuses.has(CANNOT_BURN_FUSES) || !fuses.has(CANNOT_UNWRAP)) {
        return states[2];
      }
      if (
        (key === 'setRecord' || key === 'setTTL') &&
        fuses.has(CANNOT_SET_TTL)
      ) {
        return states[2];
      }
      if (key === 'setRecord' && fuses.has(CANNOT_SET_RESOLVER)) {
        return states[2];
      }
      return states[1];
    }
    return states[0];
  };

  return (
    <table width="100%" align="center">
      <thead>
        <tr>
          <th align="center">ens.eth</th>
          <th align="center">sub.ens.eth</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(methods).map(([key, value], index) => {
          return (
            <tr key={`table-${index}`}>
              <td
                align="center"
                style={conditions(
                  parentFuses,
                  childFuses,
                  !!value[0] ? key : '-'
                )}
              >
                {!!value[0] ? key : '-'}
              </td>
              <td
                align="center"
                style={conditions(childFuses, null, !!value[1] ? key : '-')}
              >
                {!!value[1] ? key : '-'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function generateCheckbox(
  index,
  color,
  label,
  fuses,
  changeCallback,
  disabled = false
) {
  return (
    <Checkbox
      key={`checkbox-${index}`}
      color={color}
      label={label}
      variant="switch"
      disabled={disabled}
      defaultChecked={fuses.has(label)}
      onChange={(e) =>
        changeCallback((previousState) =>
          e.target.checked
            ? new Set(previousState).add(label)
            : new Set([...previousState].filter((x) => x !== label))
        )
      }
    />
  );
}

const App = () => {
  const [parentFuses, setParentFuses] = useState(
    new Set(['PARENT_CANNOT_CONTROL', 'CANNOT_UNWRAP'])
  );
  const [childFuses, setChildFuses] = useState(new Set());
  const [interactiveView, toggleInteractiveView] = useState(true);

  const scrollPosition = useScrollPosition();
  console.log(scrollPosition);

  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL } = fusesDict;
  return (
    <ThemeProvider theme={lightTheme}>
      <ThorinGlobalStyles />
      <Container>
        {interactiveView ? (
          <>
            <div className="fuseLogo">
              <h1>Fuse Book</h1>
              <div>Interactive Fuse Guide for NameWrapper</div>
            </div>
            <div
              className="changeViewButton"
              onClick={() => toggleInteractiveView((prev) => !prev)}
            >
              Switch to Table view
            </div>
            <Panel>
              <Rail>
                <InteractiveView
                  name="ens.eth"
                  fusesDict={fusesDict}
                  parentFuses={parentFuses}
                  childFuses={childFuses}
                  setFuses={setParentFuses}
                  checkParent={checkParent}
                  checkSelf={checkSelf}
                  scrollPosition={scrollPosition}
                />
              </Rail>
              <Rail style={{ height: '700px' }}>
                <InteractiveView
                  name="sub1.ens.eth"
                  fusesDict={fusesDict}
                  parentFuses={parentFuses}
                  childFuses={childFuses}
                  setFuses={setChildFuses}
                  checkParent={checkParent}
                  checkSelf={checkSelf}
                />
              </Rail>
            </Panel>
          </>
        ) : (
          <Grid>
            <Card padding="4" shadow>
              <Heading>Fuse Book</Heading>
              <Typography>Interactive Fuse Guide for NameWrapper</Typography>
              <InnerContainer>
                <FieldSet legend="ens.eth">
                  <pre>
                    State: [{new Array(...parentFuses).join(' | ').toString()}]
                  </pre>
                  {Object.values(fusesDict)
                    .reverse()
                    .map((fuse, index) =>
                      generateCheckbox(
                        index,
                        fuse === CANNOT_UNWRAP ? 'yellow' : 'red',
                        fuse,
                        parentFuses,
                        setParentFuses,
                        fuse === PARENT_CANNOT_CONTROL
                          ? false
                          : !checkSelf(parentFuses, fuse)
                      )
                    )}
                </FieldSet>
              </InnerContainer>

              <InnerContainer>
                <FieldSet legend="sub.ens.eth">
                  <pre>
                    State: [{new Array(...childFuses).join(' | ').toString()}]
                  </pre>
                  {Object.values(fusesDict)
                    .reverse()
                    .map((fuse, index) =>
                      generateCheckbox(
                        index + 10, // different indexes than parent
                        fuse === CANNOT_UNWRAP ? 'yellow' : 'red',
                        fuse,
                        childFuses,
                        setChildFuses,
                        fuse === PARENT_CANNOT_CONTROL
                          ? !checkParent(parentFuses, PARENT_CANNOT_CONTROL)
                          : !checkSelf(childFuses, fuse)
                      )
                    )}
                </FieldSet>
              </InnerContainer>
            </Card>
            <div className="tableContainer">
              <div
                className="changeViewButton"
                onClick={() => toggleInteractiveView((prev) => !prev)}
              >
                Switch to Interactive view
              </div>
              {generateTable(parentFuses, childFuses)}
            </div>
          </Grid>
        )}
      </Container>
    </ThemeProvider>
  );
};

const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(window.pageYOffset);
    };
    window.addEventListener('scroll', updatePosition);
    updatePosition();
    return () => window.removeEventListener('scroll', updatePosition);
  }, []);

  return scrollPosition;
};

export default App;

import React, { useState } from 'react';
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
import './App.css';

const Grid = styled.div(
  ({ theme }) => css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    box-sizing: border-box;
    gap: 50px;
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
    { color: 'black' },
    { backgroundColor: 'green', color: 'white' },
    { backgroundColor: 'red', color: 'white' },
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
      if (fuses.has(CANNOT_SET_RESOLVER)) {
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
        {Object.entries(methods).map(([key, value]) => {
          return (
            <tr>
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

const App = () => {
  const [parentFuses, setParentFuses] = useState(new Set());
  const [childFuses, setChildFuses] = useState(new Set());
  const {
    CANNOT_BURN_FUSES,
    CANNOT_CREATE_SUBDOMAIN,
    CANNOT_SET_RESOLVER,
    CANNOT_TRANSFER,
    CANNOT_SET_TTL,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;
  return (
    <ThemeProvider theme={lightTheme}>
      <ThorinGlobalStyles />
      <Container>
        <Grid>
          <Card padding="4" shadow>
            <Heading>Fuse Book</Heading>
            <Typography>Interactive Fuse Guide for NameWrapepr</Typography>
            <InnerContainer>
              <FieldSet legend="ens.eth">
                <pre>
                  State: [{new Array(...parentFuses).join(' | ').toString()}]
                </pre>
                <Checkbox
                  color="yellow"
                  label={CANNOT_UNWRAP}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_UNWRAP)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_UNWRAP)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_UNWRAP
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_BURN_FUSES}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_BURN_FUSES)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_BURN_FUSES)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_BURN_FUSES
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_SET_RESOLVER}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_SET_RESOLVER)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_SET_RESOLVER)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_SET_RESOLVER
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_SET_TTL}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_SET_TTL)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_SET_TTL)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_SET_TTL
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_TRANSFER}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_TRANSFER)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_TRANSFER)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_TRANSFER
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_CREATE_SUBDOMAIN}
                  variant="switch"
                  disabled={!checkSelf(parentFuses, CANNOT_CREATE_SUBDOMAIN)}
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_CREATE_SUBDOMAIN)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_CREATE_SUBDOMAIN
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={PARENT_CANNOT_CONTROL}
                  variant="switch"
                  onChange={(e) =>
                    setParentFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(PARENT_CANNOT_CONTROL)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== PARENT_CANNOT_CONTROL
                            )
                          )
                    )
                  }
                />
              </FieldSet>
            </InnerContainer>

            <InnerContainer>
              <FieldSet legend="sub.ens.eth">
                <pre>
                  State: [{new Array(...childFuses).join(' | ').toString()}]
                </pre>
                <Checkbox
                  color="yellow"
                  label={CANNOT_UNWRAP}
                  disabled={!checkSelf(childFuses, CANNOT_UNWRAP)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_UNWRAP)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_UNWRAP
                            )
                          )
                    )
                  }
                  variant="switch"
                />
                <Checkbox
                  color="red"
                  label={CANNOT_CREATE_SUBDOMAIN}
                  disabled={!checkSelf(childFuses, CANNOT_CREATE_SUBDOMAIN)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_CREATE_SUBDOMAIN)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_CREATE_SUBDOMAIN
                            )
                          )
                    )
                  }
                  variant="switch"
                />
                <Checkbox
                  color="red"
                  label={CANNOT_SET_RESOLVER}
                  variant="switch"
                  disabled={!checkSelf(childFuses, CANNOT_SET_RESOLVER)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_SET_RESOLVER)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_SET_RESOLVER
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_SET_TTL}
                  variant="switch"
                  disabled={!checkSelf(childFuses, CANNOT_SET_TTL)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_SET_TTL)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_SET_TTL
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_TRANSFER}
                  variant="switch"
                  disabled={!checkSelf(childFuses, CANNOT_TRANSFER)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_TRANSFER)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_TRANSFER
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={PARENT_CANNOT_CONTROL}
                  variant="switch"
                  disabled={!checkParent(parentFuses, PARENT_CANNOT_CONTROL)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(PARENT_CANNOT_CONTROL)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== PARENT_CANNOT_CONTROL
                            )
                          )
                    )
                  }
                />
                <Checkbox
                  color="red"
                  label={CANNOT_BURN_FUSES}
                  disabled={!checkSelf(childFuses, CANNOT_BURN_FUSES)}
                  onChange={(e) =>
                    setChildFuses((previousState) =>
                      e.target.checked
                        ? new Set(previousState).add(CANNOT_BURN_FUSES)
                        : new Set(
                            [...previousState].filter(
                              (x) => x !== CANNOT_BURN_FUSES
                            )
                          )
                    )
                  }
                  variant="switch"
                />
              </FieldSet>
            </InnerContainer>
          </Card>
          <div className="tableContainer">
            {generateTable(parentFuses, childFuses)}
          </div>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default App;

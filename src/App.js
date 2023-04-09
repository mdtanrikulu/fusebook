import React, { useEffect, useLayoutEffect, useState } from 'react';
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import Lottie from 'react-lottie-light-js';
import Tour from 'reactour';
import styled, { css, ThemeProvider } from 'styled-components';
import {
  ThorinGlobalStyles,
  lightTheme,
  Card,
  FieldSet,
  Checkbox,
  Heading,
  Typography,
} from '@ensdomains/thorin';
import Highlight, { defaultProps } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/nightOwl';
import InteractiveView from './Interactive';
import './App.css';

// ref/credit: https://lottiefiles.com/27323-scroll-down
import scrollIconJSON from './assets/scroll-down.json';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: scrollIconJSON,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice',
  },
};

const PHASE_5_Y_POS = 4000;

const jsCode = `
import { ENS } from '@ensdomains/ensjs';
import { ethers } from 'ethers';

const PROVIDER_URL = '';
const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

const ENSInstance = new ENS();
await ENSInstance.setProvider(provider);

await ensInstance.wrapName('ens.eth', {
  wrappedOwner: ADDRESS,
  fuseOptions: {
    parent: {
      named: {parent_fuses_here}
    }
    child: {
      named: {child_fuses_here},
    },
  },
  addressOrIndex: 1,
});
`.trim();

const solidityCode = `
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "hardhat/console.sol";
contract Example {
    constructor() public {
        console.log('this is an example')
    }
}
`.trim();

const Pre = styled.pre`
  height: 100%;
  text-align: left;
  padding: 0.5em;
  font-size: 10pt;
  line-height: 1.5rem;
  overflow: scroll;
`;

const Line = styled.div`
  display: table-row;
`;

const LineNo = styled.span`
  display: table-cell;
  text-align: right;
  padding-right: 1em;
  user-select: none;
  opacity: 0.5;
`;

const LineContent = styled.span`
  display: table-cell;
`;

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
  CANNOT_APPROVE: 'CANNOT_APPROVE',
  CANNOT_CREATE_SUBDOMAIN: 'CANNOT_CREATE_SUBDOMAIN',
  CANNOT_TRANSFER: 'CANNOT_TRANSFER',
  CANNOT_SET_RESOLVER: 'CANNOT_SET_RESOLVER',
  CANNOT_SET_TTL: 'CANNOT_SET_TTL',
  CANNOT_UNWRAP: 'CANNOT_UNWRAP',
  CAN_EXTEND_EXPIRY: 'CAN_EXTEND_EXPIRY',
  PARENT_CANNOT_CONTROL: 'PARENT_CANNOT_CONTROL',
});

function checkParent(parentFuses, childFuse) {
  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL, CAN_EXTEND_EXPIRY } = fusesDict;

  if (childFuse === PARENT_CANNOT_CONTROL) {
    return parentFuses.has(CANNOT_UNWRAP);
  }

  if (childFuse === CAN_EXTEND_EXPIRY) {
    return false;
  }
}

function checkSelf(fuses, fuse) {
  const {
    CANNOT_BURN_FUSES,
    CANNOT_APPROVE,
    CANNOT_CREATE_SUBDOMAIN,
    CANNOT_TRANSFER,
    CANNOT_SET_RESOLVER,
    CANNOT_SET_TTL,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;

  if (fuse === CANNOT_APPROVE) {
    return true;
  }

  if (fuse === CANNOT_UNWRAP) {
    return fuses.has(PARENT_CANNOT_CONTROL);
  }
  if (
    // user fuses
    fuse === CANNOT_TRANSFER ||
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
    CANNOT_APPROVE,
    CANNOT_CREATE_SUBDOMAIN,
    CANNOT_TRANSFER,
    CANNOT_SET_RESOLVER,
    CANNOT_SET_TTL,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
    CAN_EXTEND_EXPIRY,
  } = fusesDict;

  const methods = {
    wrapETH2LD: [1, 0],
    registerAndWrapETH2LD: [1, 0],
    wrap: [1, 1],
    approve: [1, 1],
    setChildFuses: [1, 1],
    setSubnodeOwner: [1, 1],
    setSubnodeRecord: [1, 1],
    setResolver: [1, 1],
    setTTL: [1, 1],
    setRecord: [1, 1],
    setFuses: [1, 1],
    safeTransferFrom: [1, 1],
    safeBatchTransferFrom: [1, 1],
    extendExpiry: [0, 1],
    renew: [1, 1],
    unwrapETH2LD: [1, 0],
    unwrap: [1, 1],
  };

  const states = [
    { backgroundColor: 'white', color: 'rgb(95, 95, 95)' },
    { backgroundColor: '#C7F2C2', color: 'rgb(95, 95, 95)' }, // green
    { backgroundColor: '#F2CBC7', color: 'rgb(95, 95, 95)' }, // red
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
    if (key === 'unwrap' || key === 'unwrapETH2LD') {
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

    if (key === 'approve') {
      if (fuses.has(CANNOT_APPROVE)) {
        return states[2];
      }
      return states[1];
    }

    if (key === 'extendExpiry') {
      if (fuses.has(CAN_EXTEND_EXPIRY)) {
        return states[1];
      }
      return states[2];
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

function createArrow(fuse, index, windowWidth, isPCC = false) {
  windowWidth =
    windowWidth < 1250
      ? windowWidth + ((1250 - windowWidth) * 550) / windowWidth
      : windowWidth;
  const arrowEndWidth = isPCC
    ? ((windowWidth + 600) / 5.2) * (index / 42 + 1)
    : (windowWidth - 200) / 1.25;
  const arrowEndHeight = isPCC ? 450 * (index / 7 + 1) : 216 + 64 * index;
  const arrowStartHeight = 70 + 10 * index;
  const arrowStartWidth = isPCC
    ? (windowWidth / 2.3) * (index / 46 + 1)
    : (windowWidth - 100) / 1.72 - 10 * index;
  return (
    <svg
      style={{ position: 'absolute', marginTop: '-150px', zIndex: 2 }}
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id="triangle"
          viewBox="0 0 10 10"
          refX="1"
          refY="5"
          markerUnits="strokeWidth"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
        </marker>
      </defs>
      <polyline
        id={`pl_${fuse}`}
        className="path"
        fill="none"
        stroke="black"
        strokeOpacity={0.4}
        strokeWidth={3}
        points={`${arrowStartWidth},0 
        ${arrowStartWidth},${arrowStartHeight} 
        ${
          isPCC
            ? arrowEndWidth + 40 * (index + 1)
            : arrowEndWidth - (40 + 10 * index)
        },${arrowStartHeight} ${
          isPCC
            ? arrowEndWidth + 40 * (index + 1)
            : arrowEndWidth - (40 + 10 * index)
        },${arrowEndHeight} ${
          isPCC ? arrowEndWidth / (index / 42 + 1) : arrowEndWidth
        }, ${arrowEndHeight}`}
        markerEnd="url(#triangle)"
      />
    </svg>
  );
}

function createAnchor(windowWidth) {
  windowWidth =
    windowWidth < 1250
      ? windowWidth + ((1250 - windowWidth) * 550) / windowWidth
      : windowWidth;
  const arrowEndWidth = (windowWidth - 10) / 2.8;
  const arrowEndHeight = 240;
  const arrowStartHeight = 120;
  const arrowStartWidth = windowWidth / 2.2;
  return (
    <svg
      style={{ position: 'absolute', marginTop: '-190px', zIndex: 2 }}
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id="anchorMarker"
          viewBox="0 0 300 250"
          refX="128"
          refY="40"
          markerUnits="strokeWidth"
          markerWidth="20"
          markerHeight="20"
        >
          <path
            fill="#adacac"
            stroke="#909090"
            strokeWidth="2"
            d="M216,136a8.00039,8.00039,0,0,0-8,8,40.04584,40.04584,0,0,1-40,40,47.79539,47.79539,0,0,0-32,12.27148V120h32a8,8,0,0,0,0-16H136V78.8291a28,28,0,1,0-16,0V104H88a8,8,0,0,0,0,16h32v76.27148A47.79539,47.79539,0,0,0,88,184a40.04584,40.04584,0,0,1-40-40,8,8,0,0,0-16,0,56.0629,56.0629,0,0,0,56,56,32.03667,32.03667,0,0,1,32,32,8,8,0,0,0,16,0,32.03667,32.03667,0,0,1,32-32,56.0629,56.0629,0,0,0,56-56A8.00039,8.00039,0,0,0,216,136ZM116,52a12,12,0,1,1,12,12A12.01312,12.01312,0,0,1,116,52Z"
          />
        </marker>
      </defs>
      <polyline
        fill="none"
        stroke="brown"
        strokeWidth={6}
        points={`${arrowStartWidth},40 
    ${arrowStartWidth},${arrowStartHeight} 
    ${arrowEndWidth},${arrowStartHeight} 
    ${arrowEndWidth},${arrowEndHeight}`}
        markerEnd="url(#anchorMarker)"
      />
    </svg>
  );
}

function createArrows(windowWidth) {
  return (
    <div id="fuseArrows" style={{ pointerEvents: 'none' }}>
      {Object.values(fusesDict)
        .reverse()
        .slice(0, 2)
        .map((fuse, index) => createArrow(fuse, index, windowWidth, true))}
      {createAnchor(windowWidth)}
      {Object.values(fusesDict)
        .reverse()
        .slice(2)
        .map((fuse, index) => createArrow(fuse, index, windowWidth))}
    </div>
  );
}

const tourConfig = (setParentFuses, setTourNavDisabled) => [
  {
    content: () => {
      setTourNavDisabled(false);
      return <div>Ok, let's start with with the fuses and what they do.</div>;
    },
  },
  {
    selector: '[data-tut="tour__nw-PARENT_CANNOT_CONTROL"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          This is <code>PARENT_CANNOT_CONTROL</code> fuse. If this fuse is
          burned, existing subdomains cannot be replaced by the parent name and
          the parent can no longer burn other fuses on this child. Calls to{' '}
          <code>setSubnodeOwner</code> and <code>setSubnodeRecord</code> will
          fail if they reference a name that already exists. Attempting to burn
          fuses in <code>setChildFuses</code> will also fail.
          <br />
          <br />
          This fuse can only be burnt by the parent of a node.{' '}
          <code>PARENT_CANNOT_CONTROL</code> cannot be burned unless{' '}
          <code>CANNOT_UNWRAP</code> is burned on the parent name. Burning{' '}
          <code>PARENT_CANNOT_CONTROL</code> moves the name to the Emancipated
          state.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CAN_EXTEND_EXPIRY"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, a name will be able to extend its own expiry
          in the NameWrapper. Does not apply to .eth 2LDs, as the expiry will
          inherit from the registrar in that case, and this fuse will not be
          burned when wrapping/registering .eth 2LDs.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_UNWRAP"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, the name cannot be unwrapped, and calls to{' '}
          <code>unwrap</code> and <code>unwrapETH2LD</code>, as well as other
          effects that would unwrap a name such as <code>setSubnodeOwner</code>{' '}
          will fail.
          <br />
          <br />
          <code>CANNOT_UNWRAP</code> cannot be burned unless{' '}
          <code>PARENT_CANNOT_CONTROL</code> is also burned. Burning{' '}
          <code>CANNOT_UNWRAP</code> moves the name to the <code>Locked</code>{' '}
          state.
          <br />
          <br />
          Other user-controlled fuses cannot be burned unless{' '}
          <code>CANNOT_UNWRAP</code> is burned.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_SET_TTL"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, the TTL cannot be changed. Calls to{' '}
          <code>setTTL</code>, <code>setRecord</code>, and{' '}
          <code>setSubnodeRecord</code> will fail.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_SET_RESOLVER"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, the resolver cannot be changed. Calls to{' '}
          <code>setResolver</code>, <code>setRecord</code> and{' '}
          <code>setSubnodeRecord</code> will fail.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_TRANSFER"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, the name cannot be transferred. Calls to{' '}
          <code>safeTransferFrom</code> and <code>safeBatchTransferFrom</code>{' '}
          will fail.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_CREATE_SUBDOMAIN"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, new subdomains cannot be created. Calls to{' '}
          <code>setSubnodeOwner</code> and <code>setSubnodeRecord</code> will
          fail if they reference a name that does not already exist.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_APPROVE"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, a name owner cannot give approval to another
          address. If approval is already issued before burning this fuse, the
          approval will remain in target address. Unlike standart ERC-721
          approval method, approval won't give transfer permit to the delegatee.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_BURN_FUSES"]',
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          If this fuse is burned, no further fuses can be burned. This has the
          effect of ‘locking open’ some set of permissions on the name.
          <br />
          <br />
          Calls to <code>setFuses</code>, and other methods that modify the set
          of fuses, will fail. Other methods can still be called successfully so
          long as they do not specify new fuses to burn.
        </div>
      );
    },
  },
  {
    selector: '[data-tut="tour__nw-CANNOT_UNWRAP"]',
    content: ({ goTo }) => {
      setTourNavDisabled(true);
      return (
        <div>
          <center>
            <h4>That was it!!</h4>
          </center>
          <br />
          Now, before keep scrolling down to create a new subdomain, lets start
          with changing state of our NFT to <code>Locked</code>.
          <button
            className="button"
            onClick={() => {
              setParentFuses((previousState) =>
                new Set(previousState).add(fusesDict.CANNOT_UNWRAP)
              );
              goTo(11);
            }}
          >
            Let's burn 🔥
          </button>
        </div>
      );
    },
  },
  {
    content: () => {
      setTourNavDisabled(false);
      return (
        <div>
          <center>
            <h4>
              Congratz!! Your ENS Name is in <code>Locked</code> state.
            </h4>
          </center>
          <br />
          Which means, now you can create unlimited amount of wrapped subdomains
          under your name.
        </div>
      );
    },
  },
];

const App = () => {
  const [parentFuses, setParentFuses] = useState(
    new Set(['PARENT_CANNOT_CONTROL'])
  );
  const [childFuses, setChildFuses] = useState(new Set());
  const [interactiveView, toggleInteractiveView] = useState(true);
  const [fuseBurned, setFuseBurned] = useState(false);
  const [isTourOpen, setTourOpen] = useState(false);
  const [isTourNavDisabled, setTourNavDisabled] = useState(false);
  const [isScrollAnimPaused, setScrollAnimPaused] = useState(false);

  const scrollPosition = useScrollPosition();
  const [width] = useWindowSize();

  if (scrollPosition < PHASE_5_Y_POS) {
    const fuseArrows = document.getElementById('fuseArrows');
    if (fuseArrows) {
      const polylines = fuseArrows.getElementsByTagName('polyline');
      Array.from(polylines).forEach((polyline) =>
        polyline.classList.remove('path')
      );
    }
    isScrollAnimPaused && setScrollAnimPaused(false);
  } else {
    !isScrollAnimPaused && setScrollAnimPaused(true);
  }

  const handleSubdomainCreation = () => {
    const fuseArrows = document.getElementById('fuseArrows');
    if (fuseArrows) {
      const polylines = fuseArrows.getElementsByTagName('polyline');
      Array.from(polylines).forEach((polyline) => {
        if (childFuses.has(fusesDict.PARENT_CANNOT_CONTROL)) {
          polyline.classList.add('path');
        } else if (childFuses.has(polyline.id.replace('pl_', ''))) {
          polyline.classList.add('path');
        }
        polyline.style.opacity = 0.5;
      });
    }
  };

  function toggleCode(evt, cityName) {
    let i, tabcontent, tablinks;

    tabcontent = document.getElementsByClassName('tabcontent');
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = 'none';
    }

    tablinks = document.getElementsByClassName('tablinks');
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(' active', '');
    }
    if (cityName) {
      document.getElementById(cityName).style.display = 'block';
      document.getElementById('closeTab').style.display = 'block';
      evt.currentTarget.className += ' active';
    } else {
      document.getElementById('closeTab').style.display = 'none';
    }
  }

  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL, CAN_EXTEND_EXPIRY } = fusesDict;
  return (
    <ThemeProvider theme={lightTheme}>
      <ThorinGlobalStyles />
      <Container>
        {interactiveView ? (
          <>
            <Tour
              onRequestClose={() => setTourOpen(false)}
              steps={tourConfig(setParentFuses, setTourNavDisabled)}
              isOpen={isTourOpen}
              maskClassName="mask"
              className="helper"
              rounded={10}
              startAt={0}
              showNavigation={!isTourNavDisabled}
              showButtons={!isTourNavDisabled}
              disableKeyboardNavigation={
                isTourNavDisabled ? ['esc', 'right'] : false
              }
              lastStepNextButton={<button>Done!</button>}
              accentColor="rgb(56, 136, 255)"
              onAfterOpen={(target) => disableBodyScroll(target)}
              onBeforeClose={(target) => enableBodyScroll(target)}
            />
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
                  setParentFuses={setParentFuses}
                  setChildFuses={setChildFuses}
                  checkParent={checkParent}
                  checkSelf={checkSelf}
                  scrollPosition={scrollPosition}
                  fuseBurned={fuseBurned}
                  setFuseBurned={setFuseBurned}
                  handleSubdomainCreation={handleSubdomainCreation}
                  startTour={() => {
                    setTourOpen(true);
                  }}
                />
              </Rail>
              {createArrows(width)}
              <Rail style={{ height: '700px' }}>
                <InteractiveView
                  name="sub1.ens.eth"
                  fusesDict={fusesDict}
                  parentFuses={parentFuses}
                  childFuses={childFuses}
                  setParentFuses={setParentFuses}
                  setChildFuses={setChildFuses}
                  checkParent={checkParent}
                  checkSelf={checkSelf}
                  fuseBurned={fuseBurned}
                  setFuseBurned={setFuseBurned}
                />
              </Rail>
            </Panel>
            <div
              className="scroll-icon"
              style={{ opacity: isScrollAnimPaused ? 0 : 1 }}
            >
              <Lottie
                options={defaultOptions}
                height={100}
                width={100}
                isPaused={isScrollAnimPaused || isTourOpen}
              />
            </div>
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
                        fuse === PARENT_CANNOT_CONTROL ||
                          fuse === CAN_EXTEND_EXPIRY
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
            <div className="exportCode">
              <div className="tab">
                {/* <button
                  className="tablinks"
                  onClick={(event) => toggleCode(event, 'Javascript')}
                >
                  Javascript
                </button>
                <button
                  className="tablinks"
                  onClick={(event) => toggleCode(event, 'Solidity')}
                >
                  Solidity
                </button>
                <button
                  id="closeTab"
                  style={{ display: 'none' }}
                  className="tablinks"
                  onClick={(event) => toggleCode(event)}
                >
                  ✕
                </button> */}
                <div className="source">
                  <a href="https://twitter.com/ensdomains">@ensdomains</a> -{' '}
                  <a href="https://github.com/mdtanrikulu/fusebook/">source</a>
                </div>
              </div>

              {/* <div id="Javascript" className="tabcontent">
                <Highlight
                  {...defaultProps}
                  theme={theme}
                  code={jsCode
                    .replace(
                      '{parent_fuses_here',
                      `[${new Array(...parentFuses).join(', ')}]`
                    )
                    .replace(
                      '{child_fuses_here',
                      `[${new Array(...childFuses).join(', ')}]`
                    )}
                  language="js"
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <Pre className={className} style={style}>
                      {tokens.map((line, i) => (
                        <Line key={i} {...getLineProps({ line, key: i })}>
                          <LineNo>{i + 1}</LineNo>
                          <LineContent>
                            {line.map((token, key) => (
                              <span
                                key={key}
                                {...getTokenProps({ token, key })}
                              />
                            ))}
                          </LineContent>
                        </Line>
                      ))}
                    </Pre>
                  )}
                </Highlight>
              </div>

              <div id="Solidity" className="tabcontent">
                <Highlight
                  {...defaultProps}
                  theme={theme}
                  code={solidityCode}
                  language="ts"
                >
                  {({
                    className,
                    style,
                    tokens,
                    getLineProps,
                    getTokenProps,
                  }) => (
                    <Pre className={className} style={style}>
                      {tokens.map((line, i) => (
                        <Line key={i} {...getLineProps({ line, key: i })}>
                          <LineNo>{i + 1}</LineNo>
                          <LineContent>
                            {line.map((token, key) => (
                              <span
                                key={key}
                                {...getTokenProps({ token, key })}
                              />
                            ))}
                          </LineContent>
                        </Line>
                      ))}
                    </Pre>
                  )}
                </Highlight>
              </div> */}
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

function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

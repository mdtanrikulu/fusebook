import React, { useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import Tippy from '@tippyjs/react';
import matchboxIcon from './assets/matchbox.svg';
import arrowImg from './assets/arrow.svg';

const PHASE_INTRO_Y_POS = 300;
const PHASE_BASE_Y_POS = 735;
const PHASE_1_Y_POS = 800;
const PHASE_2_Y_POS = 1600;
const PHASE_3_Y_POS = 2200;
const PHASE_4_Y_POS = 3000;
const PHASE_5_Y_POS = 4000;

const BACKGROUND_RED = { backgroundColor: 'rgb(214, 112, 112)' };
const BACKGROUND_GREEN = { backgroundColor: 'rgb(73, 179, 147)' };

const labelDict = {
  CANNOT_BURN_FUSES: 'Cannot Burn Fuses',
  CANNOT_CREATE_SUBDOMAIN: 'Create Subdomain',
  CANNOT_TRANSFER: 'Transfer',
  CANNOT_SET_RESOLVER: 'Set Resolver',
  CANNOT_SET_TTL: 'Set TTL',
  CANNOT_UNWRAP: 'Cannot Unwrap',
  PARENT_CANNOT_CONTROL: 'Parent Cannot Control',
};

const InteractiveGrid = styled.div(
  () => css`
    display: grid;
    min-width: 700px;
    margin: 0 20%;
    grid-template-columns: repeat(3, 1fr);
    grid-template-areas:
      'pf img ocf'
      'pf base ocf'
      'sec sec sec';
    box-sizing: border-box;
    background-color: black;
    border: 3px solid black;
    border-radius: 13px;
    gap: 2px;
  `
);

function generateCheckbox(
  index,
  color,
  label,
  fuses,
  changeCallback,
  disabled = false,
  isSubname = false,
  nonce = ''
) {
  return (
    <div
      key={`checkbox-${index}`}
      id={`fuseBox${!isSubname ? '2LD' : '3LD'}_${label}${nonce}`}
      className={`fuse-switch ${disabled ? `disabled` : color}`}
    >
      <label>
        <input
          id={`fuseBoxInput${!isSubname ? '2LD' : '3LD'}_${label}`}
          type="checkbox"
          value="1"
          disabled={disabled}
          checked={fuses.has(label)}
          defaultChecked={fuses.has(label)}
          onChange={(e) =>
            changeCallback((previousState) =>
              e.target.checked
                ? new Set(previousState).add(label)
                : new Set([...previousState].filter((x) => x !== label))
            )
          }
        />
        <span>{labelDict[label]}</span>
      </label>
    </div>
  );
}

function setPCBackgroundState(fuses, fusesDict) {
  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL } = fusesDict;
  if (fuses.has(CANNOT_UNWRAP) && fuses.has(PARENT_CANNOT_CONTROL))
    return BACKGROUND_RED;
  return BACKGROUND_GREEN;
}

function setEmancipatedBackgroundState(fuses, fusesDict) {
  const {
    CANNOT_BURN_FUSES,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;
  if (!fuses.has(PARENT_CANNOT_CONTROL)) return BACKGROUND_RED;
  if (
    fuses.has(CANNOT_BURN_FUSES)
  )
    return BACKGROUND_RED;
  return BACKGROUND_GREEN;
}

function setOCBackgroundState(fuses, fusesDict) {
  const {
    CANNOT_BURN_FUSES,
    CANNOT_UNWRAP,
    PARENT_CANNOT_CONTROL,
  } = fusesDict;
  if (!fuses.has(CANNOT_UNWRAP) || !fuses.has(PARENT_CANNOT_CONTROL))
    return BACKGROUND_RED;
  if (
    fuses.has(CANNOT_BURN_FUSES)
  )
    return BACKGROUND_RED;
  return BACKGROUND_GREEN;
}

export default function InteractiveView({
  name,
  fusesDict,
  parentFuses,
  childFuses,
  setParentFuses,
  setChildFuses,
  checkParent,
  checkSelf,
  scrollPosition,
  fuseBurned,
  setFuseBurned,
  handleSubdomainCreation = () => {},
}) {
  const { CANNOT_UNWRAP, PARENT_CANNOT_CONTROL } = fusesDict;
  const isSubname = name.split('.').length > 2;
  const [isTooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (!scrollPosition) return;
    const base = document.getElementById('base');
    const wrapper = document.getElementById('wrapper2LD');
    const intro = document.getElementById('interactiveIntro');
    const textInfo = document.getElementById('textInfo');
    const createSub = document.getElementById('createSub1');

    if (scrollPosition < PHASE_INTRO_Y_POS) {
      intro.style.display = 'block';
      !!fuseBurned && setFuseBurned(false);
    } else if (scrollPosition >= PHASE_INTRO_Y_POS) {
      intro.style.display = 'none';
      createSub.classList.remove('glowing');
      setTooltipVisible(false);
      const buttonCS = document.getElementById('buttonCS');
      if (buttonCS) {
        createSub.removeChild(buttonCS);
      }
    }

    if (scrollPosition < PHASE_BASE_Y_POS && base.style.position === '') {
      base.style.position = 'fixed';
      base.style.top = `${PHASE_INTRO_Y_POS}px`;
      base.style.display = 'flex';
      wrapper.style = null;
      textInfo.innerText = '';
    } else if (
      scrollPosition >= PHASE_BASE_Y_POS &&
      base.style.position === 'fixed'
    ) {
      base.style = null;
      wrapper.style.position = 'sticky';
      wrapper.style.top = '85px';
    }

    if (scrollPosition > PHASE_2_Y_POS && scrollPosition <= PHASE_3_Y_POS) {
      textInfo.innerText =
        'You can now create new ERC-1155 compliant sub-domains.';
    } else if (
      scrollPosition > PHASE_3_Y_POS &&
      scrollPosition <= PHASE_4_Y_POS
    ) {
      textInfo.innerText = 'And use fuses on both names!';
    } else if (
      scrollPosition > PHASE_4_Y_POS &&
      scrollPosition <= PHASE_5_Y_POS
    ) {
      textInfo.innerText = 'Lets create a subdomain as an NFT!';
      createSub.classList.add('glowing');
    } else if (scrollPosition > PHASE_5_Y_POS) {
      textInfo.innerText = '';
      if (!fuseBurned) {
        setTooltipVisible(true);
        const tippy = document.querySelectorAll('[id^=tippy-]')[0];
        if (tippy) {
          tippy.style.width = '500px';
        }
      }
    } else if (scrollPosition > PHASE_1_Y_POS) {
      textInfo.innerText =
        'Your ERC-721 compliant ENS domain becomes an ERC-1155 compliant by wrapping!';
    }
  }, [scrollPosition, fuseBurned, setFuseBurned]);

  return (
    <div
      id={`wrapper${!isSubname ? '2LD' : '3LD'}`}
      style={isSubname ? { zIndex: '1' } : {}}
    >
      <InteractiveGrid>
        <div
          className="grid-pf"
          style={setPCBackgroundState(
            isSubname ? childFuses : parentFuses,
            fusesDict
          )}
        >
          <div className="header-pf">
            <h1>ERC-1155 NFT</h1>
          </div>
          <div className="fuses-pf">
            <div>
              {Object.values(fusesDict)
                .reverse()
                .slice(0, 1)
                .map((fuse, index) =>
                  generateCheckbox(
                    index,
                    fuse === CANNOT_UNWRAP ? 'yellow' : 'red',
                    fuse,
                    isSubname ? childFuses : parentFuses,
                    isSubname ? setChildFuses : setParentFuses,
                    fuse === PARENT_CANNOT_CONTROL
                      ? isSubname
                        ? !checkParent(parentFuses, PARENT_CANNOT_CONTROL)
                        : null
                      : !checkSelf(isSubname ? childFuses : parentFuses, fuse),
                    isSubname
                  )
                )}
            </div>
            <div>
              <h1>Parent Controlled Fuses</h1>
            </div>
          </div>
        </div>
        <div
          className="grid-img"
          style={setEmancipatedBackgroundState(
            isSubname ? childFuses : parentFuses,
            fusesDict
          )}
        >
          <img src={matchboxIcon} alt="fuses" width="50px" />
        </div>
        <div className="grid-base">
          <div
            id={isSubname ? 'subBase' : 'base'}
            style={
              isSubname
                ? {}
                : {
                    display: 'flex',
                    position: 'fixed',
                    top: '300px',
                  }
            }
          >
            {!isSubname && (
              <div id="interactiveIntro" className="interactiveIntro">
                <span>
                  This is your ERC-721 compliant ENS name. Let's wrap it
                  scrolling!
                </span>
                <img src={arrowImg} alt="erc-721" width="100px" />
              </div>
            )}
            <img
              id={isSubname ? 'subBase' : 'base'}
              src={`https://metadata.ens.domains/preview/${name}`}
              alt="ens.eth"
              width="200px"
            />
          </div>
        </div>
        <div
          className="grid-ocf"
          style={setOCBackgroundState(
            isSubname ? childFuses : parentFuses,
            fusesDict
          )}
        >
          <div className="header-ocf">
            <div></div>
          </div>
          <div className="fuses-ocf">
            <div>
              <h1>Owner Controlled Fuses</h1>
            </div>
            <div>
              {Object.values(fusesDict)
                .reverse()
                .slice(1)
                .map((fuse, index) =>
                  generateCheckbox(
                    index + 10, // different indexes than parent
                    fuse === CANNOT_UNWRAP ? 'yellow' : 'red',
                    fuse,
                    isSubname ? childFuses : parentFuses,
                    isSubname ? setChildFuses : setParentFuses,
                    fuse === PARENT_CANNOT_CONTROL
                      ? name.split('.').length > 2
                        ? !checkParent(parentFuses, PARENT_CANNOT_CONTROL)
                        : null
                      : !checkSelf(
                          name.split('.').length > 2 ? childFuses : parentFuses,
                          fuse
                        ),
                    isSubname
                  )
                )}
            </div>
          </div>
        </div>
        <div
          className="grid-sec"
          style={setOCBackgroundState(
            isSubname ? childFuses : parentFuses,
            fusesDict
          )}
        >
          <div>
            <h1>Subname Control Check</h1>
          </div>
          <div>
            <div className="grid-sub">
              <div className="grid-sub-item">
                <span>Sub 2 fuses</span>
              </div>
              <div
                id={`createSub${isSubname ? '2' : '1'}`}
                className="grid-sub-item"
              >
                <Tippy
                  visible={isTooltipVisible}
                  interactive={true}
                  offset={[0, -34]}
                  maxWidth="none"
                  placement="top"
                  popperOptions={{
                    modifiers: [{ name: 'flip', enabled: false }],
                  }}
                  content={
                    <div className="box" tabIndex="-1">
                      <div style={{ margin: '10px 0' }}>
                        Select fuses below to burn for your subdomain in
                        creation
                      </div>
                      <div style={{ display: 'flex' }}>
                        {Object.values(fusesDict)
                          .reverse()
                          .map((fuse, index) =>
                            generateCheckbox(
                              index + 10, // different indexes than parent
                              fuse === CANNOT_UNWRAP ? 'yellow' : 'red',
                              fuse,
                              childFuses,
                              setChildFuses,
                              false,
                              true,
                              `t${index}`
                            )
                          )}
                      </div>
                      <button
                        className="button-cs"
                        onClick={() => {
                          handleSubdomainCreation();
                          setFuseBurned(true);
                          setTooltipVisible(false);
                        }}
                      >
                        Create Subdomain
                      </button>
                    </div>
                  }
                >
                  <span>Sub 1 fuses</span>
                </Tippy>
              </div>
              <div className="grid-sub-item">
                <span>Sub 3 fuses</span>
              </div>
            </div>
          </div>
        </div>
      </InteractiveGrid>
      <div id="textInfo" className="textInfo" />
    </div>
  );
}

import { Container, Tile } from 'bloomer';
import * as React from 'react';

import csa_star_logo from '../../asset/csi_star.jpeg';
import logo from '../../asset/logo.png';
import { ReactComponent as Illustrator } from './asset/data_center.svg';

const AnonymousPageLayout: React.FC = (props) => (
  <Container>
    <Tile isParent>
      <Tile isSize={5} isVertical>
        <div className="login-logo">
          <img src={logo} alt="ptt-dcloud" className="logo w-15" />
          <img src={csa_star_logo} className="logo ml-16" />
        </div>
        <div className="welcome is-hidden-mobile">
          <div className="subtitle is-size-2">Enterprise cloud for your organization</div>
          <p>
            <Illustrator className="illustrator" />
          </p>
        </div>
      </Tile>
      <Tile style={{ alignItems: 'center' }}>
        <Tile isVertical>{props.children}</Tile>
      </Tile>
    </Tile>
  </Container>
);

export default AnonymousPageLayout;

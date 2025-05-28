import { Column, Columns, Container, Hero, HeroBody, HeroFooter, Label, Section, Subtitle, Title } from 'bloomer';
import * as React from 'react';
import { NavLink } from 'react-router-dom';

interface AppHeaderProps {
  subMenu?: { [displayName: string]: string };
}

const AppTitle: React.FC = ({ children, ...props }) => <Title {...props}> {children}</Title>;
const AppSubTitle: React.FC = ({ children, ...props }) => <Subtitle {...props}>{children}</Subtitle>;

const AppHeader: React.FC<AppHeaderProps> = ({ subMenu, children }) => {
  return (
    <Hero isColor="dark" className="app-header">
      <HeroBody>
        <Container>{children}</Container>
      </HeroBody>
      {subMenu && <AppSubMenu subMenu={subMenu} />}
    </Hero>
  );
};

const AppSubMenu: React.FC<{ subMenu: { [displayName: string]: string } }> = ({ subMenu }) => (
  <HeroFooter style={{ marginTop: '1rem' }} className="is-family-secondary">
    <Container>
      <nav className="tabs">
        <ul>
          {Object.keys(subMenu).map((key) => (
            <NavLink to={subMenu[key]} data-sub-menu={key} key={key}>
              {key}
            </NavLink>
          ))}
        </ul>
      </nav>
    </Container>
  </HeroFooter>
);

const ContentWrapper: React.FC = ({ children }) => (
  <Container>
    <Section>{children}</Section>
  </Container>
);

interface DataFieldProps {
  label: string;
  dataField?: string;
  dataValue?: string;
}

const DataField: React.FC<DataFieldProps> = (props) => (
  <Columns>
    <Column isSize="1/4" style={{ padding: '0.4rem 0.4rem 0.3rem 0.75rem' }}>
      <Label>{props.label}</Label>
    </Column>
    <Column
      isSize="3/4"
      data-field={props.dataField}
      data-value={props.dataValue}
      style={{ padding: '0.4rem 0.4rem 0.3rem 0.4rem' }}
    >
      {props.children}
    </Column>
  </Columns>
);

const TitleEyebrow: React.FC = (props) => <p className="is-size-6 is-uppercase">{props.children}</p>;

export { AppHeader, AppTitle, AppSubTitle, TitleEyebrow, ContentWrapper, DataField };

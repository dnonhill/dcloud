import './app-menu.scss';

import { Navbar, NavbarBrand, NavbarDivider, NavbarDropdown, NavbarEnd, NavbarItem, NavbarLink } from 'bloomer';
import * as React from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

import logo from '../asset/logo-white.png';
import { logout, UserProfile } from '../redux/auth';
import { ApplicationState } from '../redux/state';
import { DocButtonByRoute } from './doc';
import { LinkButton } from './link-button';

export interface MenuItemData {
  displayName: string;
  linkTo: string;
  allowGroups: string[];
  external?: boolean;
}

export interface AppMenuProps {
  menuItems: MenuItemData[];
  user: UserProfile;
  onLogout: () => void;
}

const willShowWith = (user: UserProfile) => (menu: MenuItemData): boolean => {
  const userHasGroup = (group: string) => !!user.groups.find((g) => g.name === group);
  return !!menu.allowGroups.find(userHasGroup);
};

interface MenuItemProps {
  displayName: string;
  linkTo: string;
  external?: boolean;
}
const MenuItem: React.FC<MenuItemProps> = (props) => {
  const className = 'navbar-item app-menu-item';
  if (props.external) {
    return (
      <a
        href={props.linkTo}
        data-menu={props.displayName}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {props.displayName}
      </a>
    );
  } else {
    return (
      <NavLink data-menu={props.displayName} to={props.linkTo} className={className}>
        {props.displayName}
      </NavLink>
    );
  }
};

const AppMenu: React.FC<AppMenuProps> = ({ menuItems, user, onLogout }) => {
  const willShow = willShowWith(user);
  const [cookies, setCookie, removeCookie] = useCookies();

  const removeCoolies = () => {
    removeCookie('filterTicket');
    removeCookie('filterResource');
    removeCookie('filterResourceRel');
    removeCookie('filterProject');
    removeCookie('filterApplication');
  };
  return (
    <Navbar id="app-main-nav">
      <NavbarBrand id="app-main-menu">
        <NavbarItem href="/">
          <img src={logo} id="app-logo" alt="d-cloud" />
        </NavbarItem>
        {menuItems.filter(willShow).map((menu) => (
          <MenuItem
            key={menu.displayName}
            displayName={menu.displayName}
            linkTo={menu.linkTo}
            external={menu.external}
          />
        ))}
      </NavbarBrand>
      <NavbarEnd>
        <NavbarItem>
          <DocButtonByRoute />
        </NavbarItem>
        <NavbarItem hasDropdown isHoverable>
          <NavbarLink data-menu="user">Hi, {user.firstName || user.username}</NavbarLink>
          <NavbarDropdown className="is-right">
            <NavbarItem>
              <div>
                <p className="is-size-6 is-family-secondary">{user.fullname}</p>
                <p>
                  <small>{user.email}</small>
                </p>
                <LinkButton data-action="profile" className="is-small" isColor="info" to="/users/profile">
                  View Profile
                </LinkButton>
              </div>
            </NavbarItem>
            <NavbarDivider />
            <NavbarItem
              data-action="logout"
              onClick={() => {
                removeCoolies();
                onLogout();
              }}
              href="#"
            >
              Logout
            </NavbarItem>
          </NavbarDropdown>
        </NavbarItem>
      </NavbarEnd>
    </Navbar>
  );
};

const MAIN_MENU: MenuItemData[] = [
  {
    displayName: 'MY PROJECTS',
    linkTo: '/projects',
    allowGroups: ['requestor'],
  },
  {
    displayName: 'REVIEWS',
    linkTo: '/reviews/status-pending',
    allowGroups: ['reviewer'],
  },
  {
    displayName: 'APPROVEMENTS',
    linkTo: '/approvements/status-pending',
    allowGroups: ['approver'],
  },
  {
    displayName: 'DISPATCH TICKET',
    linkTo: '/assignments',
    allowGroups: ['cloudadmin'],
  },
  {
    displayName: 'MY TASKS',
    linkTo: '/my-assignments',
    allowGroups: ['operator'],
  },
  {
    displayName: 'SEARCH CENTER',
    linkTo: '/search',
    allowGroups: ['operator', 'cloudadmin', 'reviewer'],
  },
  {
    displayName: 'PRICE CALCULATOR',
    linkTo: '/price-calculator',
    allowGroups: ['requestor', 'approver', 'operator', 'cloudadmin'],
  },
  {
    displayName: 'BILLING',
    linkTo: '/billing',
    allowGroups: ['cloudadmin', 'operator'],
  },
  {
    displayName: 'BILLING SERVICE',
    external: true,
    linkTo: 'https://grp-ocisrv-p01.pttgrp.corp/uiserver/login.html',
    allowGroups: ['operator', 'cloudadmin'],
  },
];

const AppMenuContainer: React.FC = () => {
  const user = useSelector<ApplicationState, UserProfile | undefined>((state) => state.auth.profile);
  const dispatch = useDispatch();
  const onLogout = React.useCallback(() => dispatch(logout()), [dispatch]);

  return user ? <AppMenu user={user} menuItems={MAIN_MENU} onLogout={onLogout} /> : null;
};

export { AppMenu };
export default AppMenuContainer;

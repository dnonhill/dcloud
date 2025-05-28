import { cleanup, render } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter as Router } from 'react-router';

import { UserProfile } from '../redux/auth';
import { AppMenu, MenuItemData } from './app-menu';

const user: UserProfile = {
  id: 1,
  username: 'username',
  firstName: 'first name',
  lastName: 'last name',
  fullname: 'first last',
  email: 'username@email.com',
  groups: [],
};

it('render with single group user', () => {
  user.groups = [{ id: 0, name: 'requestor' }];
  const menuItems: MenuItemData[] = [
    { displayName: 'only requestor', linkTo: '/only-requestor', allowGroups: ['requestor'] },
    {
      displayName: 'requestor and approver',
      linkTo: '/requestor-and-approver',
      allowGroups: ['requestor', 'approver'],
    },
    { displayName: 'only approver', linkTo: '/only-approver', allowGroups: ['approver'] },
  ];

  const { container, getByText } = render(
    <Router>
      <AppMenu user={user} menuItems={menuItems} onLogout={() => {}} />
    </Router>,
  );
  const items = container.querySelectorAll('.app-menu-item');
  expect(items).toHaveLength(2);

  expect(getByText('only requestor')).toBeTruthy();
  expect(getByText('requestor and approver')).toBeTruthy();
});

it('render with multiple groups user', () => {
  user.groups = [
    { id: 0, name: 'requestor' },
    { id: 1, name: 'approver' },
  ];
  const menuItems: MenuItemData[] = [
    { displayName: 'only requestor', linkTo: '/only-requestor', allowGroups: ['requestor'] },
    {
      displayName: 'requestor and approver',
      linkTo: '/requestor-and-approver',
      allowGroups: ['requestor', 'approver'],
    },
    { displayName: 'only approver', linkTo: '/only-approver', allowGroups: ['approver'] },
    { displayName: 'only operator', linkTo: '/only-operator', allowGroups: ['operator'] },
  ];

  const { container, getByText } = render(
    <Router>
      <AppMenu user={user} menuItems={menuItems} onLogout={() => {}} />
    </Router>,
  );
  const items = container.querySelectorAll('.app-menu-item');
  expect(items).toHaveLength(3);

  expect(getByText('only requestor')).toBeTruthy();
  expect(getByText('requestor and approver')).toBeTruthy();
  expect(getByText('only approver')).toBeTruthy();
});

afterEach(cleanup);

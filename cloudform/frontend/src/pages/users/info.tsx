import { Icon, Level, LevelItem, LevelLeft, LevelRight } from 'bloomer';
import { capitalize } from 'lodash';
import * as React from 'react';

import { DataField, Divider, LinkButton } from '../../components';
import { useProfileContext } from './context';

const ProfileInfo: React.FC = () => {
  const profile = useProfileContext();

  return (
    <>
      {profile.isLocal && (
        <Level>
          <LevelLeft />
          <LevelRight>
            <LevelItem>
              <LinkButton to="edit">
                <Icon className="fas fa-user" />
                <span>Edit profile</span>
              </LinkButton>
            </LevelItem>
            <LevelItem>
              <LinkButton to="change-password">
                <Icon className="fas fa-key" />
                <span>Change password</span>
              </LinkButton>
            </LevelItem>
          </LevelRight>
        </Level>
      )}
      <DataField label="Username" dataField="username">
        {profile.username}
      </DataField>
      <DataField label="Name" dataField="name">
        {profile.fullname || profile.username}
      </DataField>

      <DataField label="Groups" dataField="groups">
        {profile.groups
          .map((g) => capitalize(g.name))
          .filter((name) => name !== 'Unknown')
          .join(', ')}
      </DataField>

      <Divider dataContent="Contact" />
      <DataField label="Email address" dataField="email">
        {profile.email}
      </DataField>

      <DataField label="Mobile" dataField="mobile">
        {profile.mobile}
      </DataField>
      <DataField label="Telephone" dataField="telephone">
        {profile.telephone}
      </DataField>

      <Divider dataContent="Organization" />
      <DataField label="Department" dataField="department">
        {profile.department}
      </DataField>
      <DataField label="Organization" dataField="organization">
        {profile.organization}
      </DataField>
      <DataField label="Company" dataField="company">
        {profile.company}
      </DataField>
    </>
  );
};

export default ProfileInfo;

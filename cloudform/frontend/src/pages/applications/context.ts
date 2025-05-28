import React from 'react';

import { ApplicationResponse } from '../../api/application';

const BLANK_APPLICATION: ApplicationResponse = {
  id: -1,
  name: '',
  description: '',
  systemDiagram: null,
  supporterName: '',
  supporterEmail: '',
  supporterDepartment: '',
  supporterOrganization: '',
  project: {
    id: -1,
    name: '',
    jobCode: '',
    owner: '',
    goLiveDate: '',
    expiredDate: '',
    activeFlag: true,
    createdAt: '',
    createdBy: { id: -1, username: '', fullname: '' },
    updatedAt: '',
    updatedBy: { id: -1, username: '', fullname: '' },
  },
  createdAt: '',
  createdBy: { id: -1, username: '', fullname: '' },
  updatedAt: '',
  updatedBy: { id: -1, username: '', fullname: '' },
  canDelete: false,
  activeFlag: true,
};

const ApplicationContext = React.createContext<ApplicationResponse>(BLANK_APPLICATION);
export default ApplicationContext;

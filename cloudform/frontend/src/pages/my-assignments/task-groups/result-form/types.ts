import { FormConfigSet } from '../../../../api/form-config';
import { TaskGroupResponse } from '../../../../api/task-group';

export interface WebServerVm {
  applicationName: string;
  readWriteUsers: string;
  readOnlyUsers: string;
  applicationPath: string;
}
export interface VmResult {
  hostname: string;
  ipAddress: string;
  networkZone: string;
  environment: string;
  databaseDetails: [];
  webserver: WebServerVm[] | [];
  initialDbAccount?: string;
  webServerAppPath?: string;
}

export interface ContainerResult {
  namespace: string;
}

export interface OtherRequestResult {
  message: string;
}

export interface ResultFormProps {
  onSubmit: (values: any) => void;
  initialValues: any;
  taskGroup: TaskGroupResponse;
  formConfig: FormConfigSet;
}

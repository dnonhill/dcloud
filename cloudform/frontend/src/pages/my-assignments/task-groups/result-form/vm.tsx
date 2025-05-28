import { Button, Control, Field, Label } from 'bloomer';
import { FieldArray, Form, Formik } from 'formik';
import _ from 'lodash';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton } from '../../../../components';
import { ErrorMessage, Input } from '../../../../components/formik';
import { PreConfigRadio } from '../../../../components/formik/pre-config';
import { ResultFormProps, VmResult, WebServerVm } from './types';

const vmResultSchema = Yup.object().shape({
  hostname: Yup.string().label('Hostname').required().min(3),
  ipAddress: Yup.string()
    .label('IP Address')
    .required()
    .matches(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Invalid IP Address',
    ),
  databaseDetails: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().label('Database name').min(5).required().max(30),
      dataSize: Yup.number().label('Data size').min(1).required().max(2048),
      databaseAccount: Yup.string().label('Database Account').min(5).required().max(30),
    }),
  ),
  webserver: Yup.array().of(
    Yup.object().shape({
      applicationName: Yup.string().label('Application name').required(),
      readWriteUsers: Yup.string().label('Read/Write users'),
      readOnlyUsers: Yup.string().label('Read only users'),
      applicationPath: Yup.string().label('Application path').required(),
    }),
  ),
});

const VmResultForm: React.FC<ResultFormProps> = (props) => {
  const { onSubmit, taskGroup, initialValues, formConfig } = props;
  const hasDb = !!taskGroup.ticketItem.specification.database;
  const hasWebServer = !!taskGroup.ticketItem.specification.webserver;

  const resourceDetails =
    taskGroup.ticketItem.resource && !_.isNumber(taskGroup.ticketItem.resource)
      ? taskGroup.ticketItem.resource.details
      : undefined;
  let databaseDetails: any[] = [];
  if (hasDb) {
    const dbdetail = taskGroup.ticketItem.specification.databaseDetails;
    for (const db of dbdetail) {
      const { name, dataSize, databaseAccount } = db;
      databaseDetails.push({
        name: name,
        dataSize: dataSize,
        databaseAccount: databaseAccount || '',
      });
    }
  }
  let webserver: WebServerVm[] = [];
  if (hasWebServer) {
    // Take webserver fields from backend
    const wsFields = taskGroup.ticketItem.specification.webserver;

    let applicationName = '';
    let readWriteUsers = '';
    let readOnlyUsers = '';
    let applicationPath  = '';
    let arrWsFields = [];
    
    if (!Array.isArray(wsFields)) {
      // if wsFields != Array, append wsFields to arrWsFields
      arrWsFields.push(wsFields) 
    } else {
      // if wsFields is Array, replace wsFields to arrWsFields
      arrWsFields = wsFields;
    }

    // loop over arrWsFields
    for (const webServer of arrWsFields) {
      if (webServer && 'applicationName' in webServer) {
        applicationName = webServer.applicationName;
      }
      
      if (webServer && 'readWriteUsers' in webServer) {
        readWriteUsers = webServer.readWriteUsers;
      }
      
      if (webServer && 'readOnlyUsers' in webServer) {
        readOnlyUsers = webServer.readOnlyUsers;
      }
      
      if (webServer && 'applicationPath' in webServer) {
        applicationPath = webServer.applicationPath;
      }
      
      webserver.push({
        applicationName: applicationName,
        readWriteUsers: readWriteUsers,
        readOnlyUsers: readOnlyUsers,
        applicationPath: applicationPath || '',
      });
    }
  }
  const formInitValues: VmResult = {
    hostname: resourceDetails ? resourceDetails.hostname : '',
    ipAddress: resourceDetails ? resourceDetails.ipAddress : '',
    initialDbAccount: resourceDetails ? resourceDetails.initialDbAccount : undefined,
    webServerAppPath: resourceDetails ? resourceDetails.webServerAppPath : undefined,
    databaseDetails: databaseDetails ? databaseDetails : [],
    webserver: webserver ? webserver : [],
    networkZone: taskGroup.ticketItem.action === 'create' ? taskGroup.ticketItem.specification.networkZone : undefined,
    environment: taskGroup.ticketItem.specification.environment,
    ...initialValues,
  };

  return (
    <Formik initialValues={formInitValues} validationSchema={vmResultSchema} onSubmit={onSubmit}>
      {(_) => (
        <Form>
          <Field>
            <Label>Hostname</Label>
            <Input name="hostname" />
            <ErrorMessage name="hostname" />
          </Field>

          <Field>
            <Label>IP Address</Label>
            <Input name="ipAddress" />
            <ErrorMessage name="ipAddress" />
          </Field>

          {taskGroup.ticketItem.action === 'create' && (
            <Field>
              <Label>Environment</Label>
              <PreConfigRadio
                name="environment"
                displayField="displayEnvironment"
                config={formConfig.environment || []}
              />
              <ErrorMessage name="environment" />
            </Field>
          )}

          <Field>
            <Label>Network Zone</Label>
            <PreConfigRadio
              name="networkZone"
              displayField="displayNetworkZone"
              config={formConfig.networkZone || []}
            />
            <ErrorMessage name="networkZone" />
          </Field>

          {hasDb && (
            <>
              <div className="is-divider" data-content="Database" />
              <FieldArray name="databaseDetails">
                {() =>
                  databaseDetails.map((_, index) => (
                    <div key={`${index}`} style={{ marginBottom: '16px' }}>
                      {index > 0 && databaseDetails.length != index && <hr style={{ marginTop: '30px' }} />}
                      <Field>
                        <Label>Database name</Label>
                        <Input name={`databaseDetails.${index}.name`} />
                        <ErrorMessage name={`databaseDetails.${index}.name`} />
                      </Field>
                      <Field>
                        <Label>Database size</Label>
                        <Input name={`databaseDetails.${index}.dataSize`} />
                        <ErrorMessage name={`databaseDetails.${index}.dataSize`} />
                      </Field>
                      <Field>
                        <Label>Database Account</Label>
                        <Input name={`databaseDetails.${index}.databaseAccount`} />
                        <ErrorMessage name={`databaseDetails.${index}.databaseAccount`} />
                      </Field>
                    </div>
                  ))
                }
              </FieldArray>
            </>
          )}

          {hasWebServer && (
            <>
              <div className="is-divider" data-content="Web server" />
              <FieldArray name="webserver">
                {() =>
                  webserver.map((_, index) => (
                    <div key={`${index}`} style={{ marginBottom: '16px' }}>
                      {index > 0 && webserver.length != index && <hr style={{ marginTop: '30px' }} />}
                      <Field>
                        <Label>Application URL</Label>
                        <Input name={`webserver.${index}.applicationName`} />
                        <ErrorMessage name={`webserver.${index}.applicationName`} />
                      </Field>
                      <Field>
                        <Label>Read/Write users</Label>
                        <Input name={`webserver.${index}.readWriteUsers`} />
                        {/*<ErrorMessage name={`webserver.${index}.readWriteUsers`} />*/}
                      </Field>
                      <Field>
                        <Label>Read only users</Label>
                        <Input name={`webserver.${index}.readOnlyUsers`} />
                        {/* <ErrorMessage name={`webserver.${index}.readOnlyUsers`} /> */}
                      </Field>
                      <Field>
                        <Label>Application path</Label>
                        <Input name={`webserver.${index}.applicationPath`} placeholder="D:\Appl\ExampleWeb1" />
                        <ErrorMessage name={`webserver.${index}.applicationPath`} />
                      </Field>
                    </div>
                  ))
                }
              </FieldArray>
            </>
          )}

          <Field isGrouped>
            <Control>
              <Button type="submit" isColor="primary" data-action="save">
                Save
              </Button>
            </Control>
            <Control>
              <BackButton />
            </Control>
          </Field>
        </Form>
      )}
    </Formik>
  );
};

export default VmResultForm;

import { Button, Column, Control, Field, Icon, Label, Title } from 'bloomer';
import { Columns } from 'bloomer/lib/grid/Columns';
import { Field as FormikField, FieldArray, Form, Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton, Divider } from '../../../../../components';
import { ErrorMessage, Input, Select, TimeSelector } from '../../../../../components/formik';
import FocusError from '../../../../../components/formik/error-focus';
import { PreConfigCheckBox, PreConfigRadio, PreConfigSelect } from '../../../../../components/formik/pre-config';
import PricingPanel from '../../../../pricing/pricing';
import { DatabaseDetail, VmSpecification } from '../../../resource-spec';
import { useVmFormContext } from '../preload-form-config';
import { FormProps } from './types';

const vmSchema = Yup.object().shape({
  name: Yup.string().label('Server name').required().min(3).max(15),
  cpu: Yup.number()
    .label('vCPU')
    .required()
    .min(1)
    .max(32)
    .integer()
    .test({
      name: 'even-or-one',
      exclusive: true,
      message: 'CPU should be even or one (i.e. 1, 2, 4, ...)',
      test: (value: any) => value === 1 || value % 2 === 0,
    }),
  memory: Yup.number().label('Memory').required().min(1).max(488).integer(),
  storageTier: Yup.string().label('Storage tier').required(),
  additionalOsDisk: Yup.number().label('Additional OS Disk').min(1).max(2048).integer(),
  dataDisk1Size: Yup.number().label('Data disk 1').min(1).max(2048).integer(),
  dataDisk2Size: Yup.number().label('Data disk 2').min(1).max(2048).integer(),
  os: Yup.string().label('Operating system').required(),
  protectionLevel: Yup.string().label('Protection level').required(),
  environment: Yup.string().label('Environment').required(),
  networkZone: Yup.string().label('Network zone').required(),
  database: Yup.object()
    .nullable()
    .shape({
      engine: Yup.string().label('Database engine').required(),
    }),
  databaseDetails: Yup.array()
    .nullable()
    .of(
      Yup.object().shape({
        name: Yup.string().label('Database name').min(5).required().max(30),
        dataSize: Yup.number().label('Data size').min(1).required().max(2048),
      }),
    ),
  webserver: Yup.array()
    .nullable()
    .of(
      Yup.object().shape({
        applicationName: Yup.string(),
        readWriteUsers: Yup.string(),
        readOnlyUsers: Yup.string(),
      }),
    ),
  maintenanceWindow: Yup.object()
    .shape({
      day: Yup.string().required().label('Start day'),
      startTime: Yup.string().required().label('Start time'),
      duration: Yup.string().required().label('Dutation'),
    })
    .required(),
});

export const initialValue: VmSpecification = {
  name: '',
  cpu: 1,
  memory: 2,
  storageTier: undefined,
  displayStorageTier: undefined,
  osDisk: 50,
  os: undefined,
  osType: undefined,
  displayOs: undefined,

  protectionLevel: undefined,
  displayProtectionLevel: undefined,

  environment: undefined,
  displayEnvironment: undefined,
  networkZone: undefined,
  displayNetworkZone: undefined,
  additionalOsDisk: undefined,
  dataDisk1Size: undefined,
  dataDisk2Size: undefined,
  database: null,
  databaseDetails: [],
  webserver: null,
  addOnService: [
    {display: "Log Analyst Service", value: "log_analyst_service"},
    {display: "Managed Service", value: "managed_service"},
    {display: "Monitor Service", value: "monitor_scan"},
    {display: "VA Scan Service", value: "va_scan_service"}
  ],

  maintenanceWindow: {
    day: '',
    startTime: '00:00',
    duration: '',
  },
};

const customValidation = (values: VmSpecification) => {
  const { dataDisk1Size, dataDisk2Size, databaseDetails, webserver } = values;
  const totalDatabaseSize = databaseDetails.reduce((a: number, c: DatabaseDetail) => (a += c.dataSize), 0);
  const totalDataDiskSize = Number(dataDisk1Size || 0) + Number(dataDisk2Size || 0);
  let errors: any = {
    dataDisk1Size: '',
    dataDisk2Size: '',
    databaseDetails: [],
    webserver: [],
  };

  if (totalDataDiskSize < totalDatabaseSize * 2.5) {
    if (dataDisk1Size && dataDisk2Size) {
      errors.dataDisk2Size = `Total data disk size (${totalDataDiskSize} GB) must be more than or equal to 2.5 times of total database size (${totalDatabaseSize} x 2.5 = ${
        totalDatabaseSize * 2.5
      } GB)`;
    } else if (dataDisk1Size) {
      errors.dataDisk1Size = `Total data disk size (${totalDataDiskSize} GB) must be more than or equal to 2.5 times of total database size (${totalDatabaseSize} x 2.5 = ${
        totalDatabaseSize * 2.5
      } GB)`;
    } else {
      for (let idx = 0; idx < databaseDetails.length; idx++) {
        errors.databaseDetails.push({
          dataSize: 'You must add data disk first',
        });
      }
    }
  }

  if (webserver?.length && !totalDataDiskSize) {
    for (let idx = 0; idx < webserver.length; idx++) {
      errors.webserver.push({
        readWriteUsers: 'You must add data disk first',
      });
    }
  }

  const isDatabaseSizeValid = (databaseDetailsErrors: any) =>
    databaseDetailsErrors.every((error: any) => Object.keys(error).length === 0);
  const isWebserverValid = (webserverErrors: any) =>
    webserverErrors.every((error: any) => Object.keys(error).length === 0);
  const isDataDiskSizeValid = (dataDisk1SizeError: string, dataDisk2SizeError: string) =>
    dataDisk1SizeError === '' && dataDisk2SizeError === '';
  const isValidForm =
    isDataDiskSizeValid(errors.dataDisk1Size, errors.dataDisk2Size) &&
    isDatabaseSizeValid(errors.databaseDetails) &&
    isWebserverValid(errors.webserver);

  return isValidForm ? undefined : errors;
};

const VmForm: React.FC<FormProps & { isPriceCalculator: boolean }> = (props) => {
  const { initialValues = initialValue, onSubmit, mode = 'create', isPriceCalculator } = props;
  const isEditMode = mode === 'edit';

  const initialValueFormik = { ...initialValue, ...initialValues };
  if (initialValueFormik.database) {
    initialValueFormik.databaseDetails = initialValueFormik.databaseDetails;
  }

  // For handling prev webserver type, prev webserver type is object
  if (initialValues.webserver && !Array.isArray(initialValues.webserver)) {
    initialValueFormik.webserver = [initialValues.webserver];
  }

  return (
    <>
      <Title isSize={5}>Design Virtual machine</Title>
      <Formik
        initialValues={initialValueFormik}
        validate={customValidation}
        validationSchema={vmSchema}
        onSubmit={onSubmit}
      >
        {(props) => (
          <Form>
            <Field>
              <Label>
                <span>Server name</span>&nbsp;
                <small className="has-text-success">as specified in system diagram.</small>
              </Label>
              <Input name="name" />
              <ErrorMessage name="name" />
            </Field>

            <Divider dataContent="Machine Specification" />
            <MachineSection isEditMode={isEditMode} />

            <Divider dataContent="Storage" />
            <StorageSection {...props} isEditMode={isEditMode} />

            <Divider dataContent="Backup and Data recovery" />
            <ProtectionSection isEditMode={isEditMode} />

            <div className={`${isPriceCalculator ? 'is-hidden' : ''}`}>
              <Divider dataContent="Network" />
              <NetworkSection isEditMode={isEditMode} />
            </div>

            <Divider dataContent="Downtime maintenance windows" />
            <MaintenanceWindowSection isEditMode={isEditMode} />

            <Divider dataContent="Software Package" />
            <SoftwarePackageSection isPriceCalculator={isPriceCalculator} {...props} />

            {/* <Divider dataContent="Add-on Services" /> */}
            {/* <AddOnService {...props} isEditMode={isEditMode} /> */}

            <PricingPanel item={{ resourceType: 'vm', specification: props.values }} />

            <Field isGrouped>
              <Control>
                <Button type="submit" data-action="save" isColor="primary">
                  Save
                </Button>
              </Control>
              <Control>
                <BackButton />
              </Control>
            </Field>
            <FocusError />
          </Form>
        )}
      </Formik>
    </>
  );
};

interface EditModeProps {
  isEditMode: boolean;
}

export const MachineSection: React.FC<EditModeProps> = (props) => {
  const formConfig = useVmFormContext();
  const osChoices = formConfig.os || [];
  return (
    <>
      <Field>
        <Label>vCPU (cores)</Label>
      </Field>
      <Field>
        <Control hasIcons="left">
          <Input name="cpu" type="number" />
          <Icon isAlign="left" className="fas fa-microchip" />
        </Control>
      </Field>
      <ErrorMessage name="cpu" />

      <Field>
        <Label>Memory (GB)</Label>
      </Field>
      <Field>
        <Control hasIcons="left">
          <Input name="memory" type="number" />
          <Icon isAlign="left" className="fas fa-memory" />
        </Control>
      </Field>
      <ErrorMessage name="memory" />

      <Field>
        <Label>Operating system</Label>
        <Control>
          <PreConfigSelect
            name="os"
            displayField="displayOs"
            config={osChoices}
            disabled={props.isEditMode}
            handleUnknown={props.isEditMode ? 'add_choice' : 'set_blank'}
          />
        </Control>
        <ErrorMessage name="os" />
      </Field>
    </>
  );
};

export const StorageSection: React.FC<FormikProps<VmSpecification> & EditModeProps> = (props) => {
  const {
    setFieldValue,
    values: { dataDisk1Size, dataDisk2Size, additionalOsDisk },
    initialValues,
  } = props;
  const haveAdditionalOsDisk = additionalOsDisk !== undefined;
  const haveDisk1 = dataDisk1Size !== undefined;
  const haveDisk2 = dataDisk2Size !== undefined;
  const canAddDisk = !haveDisk2;

  const formConfig = useVmFormContext();
  const storageTierChoices = formConfig.storageTier || [];

  const addDisk = () => {
    if (!haveDisk1) setFieldValue('dataDisk1Size', 10);
    else if (!haveDisk2) setFieldValue('dataDisk2Size', 10);
  };

  const removeDisk = (diskNo: 1 | 2) => {
    if (diskNo === 1) {
      if (dataDisk2Size && dataDisk2Size > 0) {
        setFieldValue('dataDisk1Size', dataDisk2Size);
        setFieldValue('dataDisk2Size', undefined);
      } else {
        setFieldValue('dataDisk1Size', undefined);
      }
    } else if (diskNo === 2) {
      setFieldValue('dataDisk2Size', undefined);
    }
  };

  const addOsDisk = () => {
    setFieldValue('additionalOsDisk', 10);
  };

  const removeOsDick = () => {
    setFieldValue('additionalOsDisk', undefined);
  };

  return (
    <>
      <Field>
        <Label>Storage read/write speed</Label>
        <Control>
          <PreConfigSelect name="storageTier" displayField="displayStorageTier" config={storageTierChoices} />
        </Control>
        <ErrorMessage name="storageTier" />
      </Field>

      <Label>
        <span>OS Disk (GB)</span>&nbsp;
        <span className="is-size-7 has-text-primary">(Drive C:\ or vda)</span>
      </Label>
      <Field isGrouped>
        <Control>
          <Input disabled type="number" name="osDisk" />
        </Control>
        {haveAdditionalOsDisk || (
          <Control>
            <Button onClick={addOsDisk}>Add more OS (Drive C:\ or vda) disk space</Button>
          </Control>
        )}
        {haveAdditionalOsDisk && (
          <>
            <Control>
              <span> + </span>
            </Control>
            <Control>
              <Input type="number" name="additionalOsDisk" />
            </Control>
            <Control>
              <Button isColor="text" onClick={removeOsDick}>
                Remove
              </Button>
            </Control>
          </>
        )}
      </Field>
      <ErrorMessage name="additionalOsDisk" />

      {haveDisk1 && (
        <>
          <Field>
            <Label>
              <span>Data Disk 1 (GB)</span>&nbsp;
              <span className="is-size-7 has-text-primary">(Drive: D:\ or vdb)</span>
            </Label>
          </Field>
          <Field hasAddons>
            <Control isFullWidth>
              <Input name="dataDisk1Size" type="number" />
            </Control>
            <Control>
              <Button
                isColor="white"
                onClick={() => removeDisk(1)}
                data-action="remove-disk-1"
                disabled={props.isEditMode && !!initialValues.dataDisk1Size}
              >
                <Icon className="fas fa-trash-alt" />
              </Button>
            </Control>
          </Field>
          <ErrorMessage name="dataDisk1Size" />
        </>
      )}

      {haveDisk2 && (
        <>
          <Field>
            <Label>
              <span>Data Disk 2 (GB)</span>&nbsp;
              <span className="is-size-7 has-text-primary">(Drive: E:\ or vdc)</span>
            </Label>
          </Field>
          <Field hasAddons>
            <Control isFullWidth>
              <Input name="dataDisk2Size" type="number" />
            </Control>
            <Control>
              <Button
                isColor="white"
                onClick={() => removeDisk(1)}
                data-action="remove-disk-2"
                disabled={props.isEditMode && !!initialValues.dataDisk2Size}
              >
                <Icon className="fas fa-trash-alt" />
              </Button>
            </Control>
          </Field>
          <ErrorMessage name="dataDisk2Size" />
        </>
      )}
      {canAddDisk && (
        <Button isColor="primary" isOutlined isSize="small" onClick={() => addDisk()} data-action="add-disk">
          <Icon className="fas fa-plus" />
          <span>Add Data disk</span>
        </Button>
      )}
    </>
  );
};

const NetworkSection: React.FC<EditModeProps> = (props) => {
  const formConfig = useVmFormContext();
  const networkZoneChoices = formConfig.networkZone || [];
  const environmentChoices = formConfig.environment || [];

  return (
    <>
      <Field>
        <Label>Environment</Label>
        <PreConfigRadio
          name="environment"
          displayField="displayEnvironment"
          config={environmentChoices}
          disabled={props.isEditMode}
        />
        <ErrorMessage name="environment" />
      </Field>

      <Field>
        <Label>Network Zone</Label>
        <PreConfigRadio name="networkZone" displayField="displayNetworkZone" config={networkZoneChoices} />
        <ErrorMessage name="networkZone" />
      </Field>
    </>
  );
};

export const ProtectionSection: React.FC<EditModeProps> = (props) => {
  const formConfig = useVmFormContext();
  const protectionLevelChoices = formConfig.protectionLevel || [];
  return (
    <>
      <Field>
        <Label>Protection Level</Label>
        <Control>
          <PreConfigSelect
            name="protectionLevel"
            config={protectionLevelChoices}
            displayField="displayProtectionLevel"
            handleUnknown={props.isEditMode ? 'add_choice' : 'set_blank'}
          />
        </Control>
        <ErrorMessage name="protectionLevel" />
      </Field>
    </>
  );
};

export const SoftwarePackageSection: React.FC<
  FormikProps<VmSpecification & { databaseDetails?: DatabaseDetail[] }> & { isPriceCalculator?: boolean }
> = (props) => {
  const {
    values: { database, webserver, databaseDetails },
    setFieldValue,
    isPriceCalculator,
  } = props;
  const hasDatabase = !!database;
  const hasWebserver = !!webserver;

  const installDatabase = () => {
    setFieldValue('database', 'Microsoft SQL Server 2018 R2');
  };

  const removeDatabase = () => {
    setFieldValue('database', null);
    setFieldValue('databaseDetails', []);
  };

  const installWebserver = React.useCallback(() => {
    setFieldValue('webserver', [
      {
        applicationName: '',
        readWriteUsers: '',
        readOnlyUsers: '',
      },
    ]);
  }, [setFieldValue]);

  const removeWebserver = React.useCallback(() => {
    setFieldValue('webserver', null);
  }, [setFieldValue]);

  const formConfig = useVmFormContext();
  const databaseEngineChoices = formConfig.databaseEngine || [];

  return (
    <>
      {hasDatabase && (
        <>
          <Title isSize={5}>Database</Title>
          <Field>
            <Label>Database Engine</Label>
            <Control>
              <PreConfigSelect
                name="database.engine"
                displayField="database.displayEngine"
                config={databaseEngineChoices}
              />
              <ErrorMessage name="database.engine" />
            </Control>
          </Field>
          <FieldArray
            name="databaseDetails"
            render={(arrayHelpers) => (
              <>
                {databaseDetails && databaseDetails.length > 0
                  ? databaseDetails.map((_, index) => (
                      <Columns key={index}>
                        <FormikField name={`databaseDetails.${index}`}>
                          {() => (
                            <>
                              <Column isSize={5}>
                                <Field>
                                  <Label>Database Name</Label>
                                  <Control>
                                    <Input type="text" name={`databaseDetails[${index}].name`} />
                                    <ErrorMessage name={`databaseDetails[${index}].name`} />
                                  </Control>
                                </Field>
                              </Column>
                              <Column isSize={5}>
                                <Field>
                                  <Label>Data size</Label>
                                  <Control>
                                    <Input type="number" name={`databaseDetails[${index}].dataSize`} />
                                    <ErrorMessage name={`databaseDetails[${index}].dataSize`} />
                                  </Control>
                                </Field>
                              </Column>
                            </>
                          )}
                        </FormikField>
                        <Column isSize={2}>
                          <div style={{ marginTop: '2rem' }}>
                            {databaseDetails.length > 1 && (
                              <Button type="button" onClick={() => arrayHelpers.remove(index)}>
                                -
                              </Button>
                            )}
                            <Button
                              type="button"
                              onClick={() =>
                                arrayHelpers.push({
                                  name: '',
                                  dataSize: 10,
                                })
                              }
                            >
                              +
                            </Button>
                          </div>
                        </Column>
                      </Columns>
                    ))
                  : arrayHelpers.push({
                      name: '',
                      dataSize: 10,
                    })}
              </>
            )}
          />
          <Field isGrouped="right">
            <Button
              isSize="small"
              isColor="primary"
              isOutlined
              data-action="remove-database"
              onClick={() => {
                removeDatabase();
              }}
            >
              Remove Database
            </Button>
          </Field>
        </>
      )}

      {hasWebserver && (
        <>
          <Title isSize={5}>Web server (IIS)</Title>
          <FieldArray
            name="webserver"
            render={(arrayHelpers) => (
              <>
                {webserver && webserver.length > 0
                  ? webserver.map((_, index) => (
                      <Columns key={index}>
                        <FormikField name={`webserver.${index}`}>
                          {() => (
                            <>
                              <Column isSize={3}>
                                <Field>
                                  <Label>Application URL</Label>
                                  <Control>
                                    <Input name={`webserver[${index}].applicationName`} placeholder="www.example1.com" />
                                    <ErrorMessage name={`webserver[${index}].applicationName`} />
                                  </Control>
                                </Field>
                              </Column>
                              <Column isSize={4}>
                                <Field>
                                  <Label>Read/Write users</Label>
                                  <Control>
                                    <Input name={`webserver[${index}].readWriteUsers`} placeholder="pttdigital\username" />
                                    <ErrorMessage name={`webserver[${index}].readWriteUsers`} />
                                  </Control>
                                </Field>
                              </Column>
                              <Column isSize={4}>
                                <Field>
                                  <Label>Read only users</Label>
                                  <Control>
                                    <Input name={`webserver[${index}].readOnlyUsers`} placeholder="pttdigital\username" />
                                    <ErrorMessage name={`webserver[${index}].readOnlyUsers`} />
                                  </Control>
                                </Field>
                              </Column>
                            </>
                          )}
                        </FormikField>
                        <Column isSize={2}>
                          <div style={{ marginTop: '2rem' }}>
                            {webserver.length > 1 && (
                              <Button type="button" onClick={() => arrayHelpers.remove(index)}>
                                -
                              </Button>
                            )}
                            <Button
                              type="button"
                              onClick={() =>
                                arrayHelpers.push({
                                  applicationName: '',
                                  readWriteUsers: '',
                                  readOnlyUsers: '',
                                })
                              }
                            >
                              +
                            </Button>
                          </div>
                        </Column>
                      </Columns>
                    ))
                  : arrayHelpers.push({
                      applicationName: '',
                      readWriteUsers: '',
                      readOnlyUsers: '',
                    })}
              </>
            )}
          />

          <Field isGrouped="right">
            <Button
              isSize="small"
              isColor="primary"
              isOutlined
              data-action="remove-webserver"
              onClick={() => removeWebserver()}
            >
              Remove Webserver
            </Button>
          </Field>
        </>
      )}

      <Field isGrouped>
        {hasDatabase || (
          <Control>
            <Button isColor="primary" isOutlined data-action="install-database" onClick={() => installDatabase()}>
              <Icon className="fas fa-database" />
              <span>Install Database</span>
            </Button>
          </Control>
        )}
        {isPriceCalculator
          ? ''
          : hasWebserver || (
              <Control>
                <Button isColor="primary" isOutlined data-action="install-webserver" onClick={() => installWebserver()}>
                  <Icon className="fas fa-globe" />
                  <span>Install WebServer</span>
                </Button>
              </Control>
            )}
      </Field>
    </>
  );
};

export const AddOnService: React.FC<FormikProps<VmSpecification> & EditModeProps> = (props) => {
  const { setFieldValue, values } = props;
  const [showAddOnService, setShowAddOnService] = React.useState(false);
  const formConfig = useVmFormContext();
  const addOnService = formConfig.addOnService || [];

  const removeAddOnService = () => {
    setShowAddOnService(false);
    setFieldValue('addOnService', []);
  };

  return showAddOnService || values.addOnService?.length ? (
    <>
      <Field>
        <Label>Services</Label>
        <PreConfigCheckBox name="addOnService" config={addOnService} />
      </Field>
      <Field isGrouped="right">
        <Button
          isSize="small"
          isColor="primary"
          isOutlined
          data-action="remove-add-on-service"
          onClick={() => removeAddOnService()}
        >
          Remove Add-on Services
        </Button>
      </Field>
    </>
  ) : (
    <Button isColor="primary" isOutlined data-action="add-add-on-service" onClick={() => setShowAddOnService(true)}>
      <Icon className="fas fa-puzzle-piece" />
      <span>Add Add-on Services</span>
    </Button>
  );
};

const MaintenanceWindowSection: React.FC<EditModeProps> = (props) => {
  const { isEditMode } = props;
  return (
    <>
      <Label>
        <span>Maintenance window</span>&nbsp;
        <small className="has-text-success">
          Select allow downtime period for maintenance task (Ex. Update security patch, reboot)
        </small>
      </Label>
      <Columns>
        <Column isSize={2}>
          <Field>
            <Label>Start day</Label>
            <Select name="maintenanceWindow.day" isFullwidth>
              <option style={{ display: 'none' }} />
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
                <option key={day} value={day}>
                  {_.capitalize(day)}
                </option>
              ))}
            </Select>
            <ErrorMessage name="maintenanceWindow.day" />
          </Field>
        </Column>
        <Column isSize={2}>
          <Field>
            <Label>Start time</Label>
            <TimeSelector name="maintenanceWindow.startTime" />
            <ErrorMessage name="maintenanceWindow.startTime" />
          </Field>
        </Column>
        <Column isSize={2}>
          <Field>
            <Label>Duration (hours)</Label>
            <Select name="maintenanceWindow.duration" isFullwidth>
              <option style={{ display: 'none' }} />
              {Array.from(Array.from(Array(47).keys()), (x) => 1 + x * 0.5).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            <ErrorMessage name="maintenanceWindow.duration" />
          </Field>
        </Column>
      </Columns>
    </>
  );
};

export default VmForm;

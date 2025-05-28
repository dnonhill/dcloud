import { Button, Column, Columns, Field as FieldBloomer, Label } from 'bloomer';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import _ from 'lodash';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';

import CustomSelect from '../pages/billing/custom-select';
import { everyValueIsEmpty, someValueIsNotEmpty } from '../utils';
import { DatePicker, ErrorMessage } from './formik';

interface Option {
  label: string;
  value: string | number;
}

interface Values {
  project?: string;
  dataCenter?: string;
  application?: string;
  resource?: string;
  jobCode?: string;
  startDate: Date;
  endDate: Date;
  tags?: string[];
}

const maxDate = DateTime.local().endOf('day').toJSDate();
const BillingFilterForm = (props: {
  projectOptions: Option[];
  applicationOptions: Option[];
  jobCodeOptions: Option[];
  dataCenterOptions: Option[];
  resourceOptions: Option[];
  tagOptions: Option[];
}) => {
  const { projectOptions, applicationOptions, jobCodeOptions, dataCenterOptions, resourceOptions, tagOptions } = props;
  const { values } = useFormikContext<Values>();

  return (
    <>
      <Columns>
        <Column>
          <Label>Project</Label>
          <Field
            className="custom-select"
            name="project"
            options={projectOptions}
            component={CustomSelect}
            placeholder="Project"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, [
              'application',
              'dataCenter',
              'resource',
              'jobCode',
              'tags',
            ])}
            isClearable
          />
          <ErrorMessage name="project" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Data Center</Label>
          <Field
            className="custom-select"
            name="dataCenter"
            options={dataCenterOptions}
            component={CustomSelect}
            placeholder="Data center"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, ['project', 'application', 'resource', 'jobCode', 'tags'])}
            isClearable
          />
          <ErrorMessage name="dataCenter" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Application</Label>
          <Field
            className="custom-select"
            name="application"
            options={applicationOptions}
            component={CustomSelect}
            placeholder="Application"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, ['project', 'dataCenter', 'resource', 'jobCode', 'tags'])}
            isClearable
          />
          <ErrorMessage name="application" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Resource name</Label>
          <Field
            className="custom-select"
            name="resource"
            options={resourceOptions}
            component={CustomSelect}
            placeholder="Resource name"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, [
              'project',
              'dataCenter',
              'application',
              'jobCode',
              'tags',
            ])}
            isClearable
          />
          <ErrorMessage name="resource" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Job code</Label>
          <Field
            className="custom-select"
            name="jobCode"
            options={jobCodeOptions}
            component={CustomSelect}
            placeholder="Job code"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, [
              'project',
              'dataCenter',
              'application',
              'resource',
              'tags',
            ])}
            isClearable
          />
          <ErrorMessage name="jobCode" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Tags</Label>
          <Field
            className="custom-select"
            name="tags"
            options={tagOptions}
            component={CustomSelect}
            placeholder="Tags"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<Values>(values, [
              'project',
              'dataCenter',
              'application',
              'resource',
              'jobCode',
            ])}
            isClearable
            isMulti
          />
          <ErrorMessage name="tags" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <FieldBloomer>
            <Label>Start Date</Label>
            <DatePicker placeholder="Start Date" name="startDate" maxDate={maxDate} />
          </FieldBloomer>
          <ErrorMessage name="startDate" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <FieldBloomer>
            <Label>End Date</Label>
            <DatePicker placeholder="End Date" name="endDate" maxDate={maxDate} />
          </FieldBloomer>
          <ErrorMessage name="endDate" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Button type={'submit'} isColor={'primary'}>
            Submit
          </Button>
        </Column>
      </Columns>
    </>
  );
};

const billingFilterSchema = Yup.object().shape(
  {
    project: Yup.string()
      .label('Project')
      .when(['dataCenter', 'application', 'resource', 'jobCode', 'tags'], {
        is: (dataCenter, application, resource, jobCode, tags) =>
          everyValueIsEmpty([dataCenter, application, resource, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    dataCenter: Yup.string()
      .label('Data center')
      .when(['project', 'application', 'resource', 'jobCode', 'tags'], {
        is: (project, application, resource, jobCode, tags) =>
          everyValueIsEmpty([project, application, resource, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    application: Yup.string()
      .label('Application')
      .when(['project', 'dataCenter', 'resource', 'jobCode', 'tags'], {
        is: (project, dataCenter, resource, jobCode, tags) =>
          everyValueIsEmpty([project, dataCenter, resource, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    resource: Yup.string()
      .label('Resource')
      .when(['project', 'dataCenter', 'application', 'jobCode', 'tags'], {
        is: (project, dataCenter, application, jobCode, tags) =>
          everyValueIsEmpty([project, dataCenter, application, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    jobCode: Yup.string()
      .label('Job code')
      .when(['project', 'dataCenter', 'application', 'resource', 'tags'], {
        is: (project, dataCenter, application, resource, tags) =>
          everyValueIsEmpty([project, dataCenter, application, resource, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    tags: Yup.array()
      .label('Tags')
      .when(['project', 'dataCenter', 'application', 'resource', 'jobCode'], {
        is: (project, dataCenter, application, resource, jobCode) =>
          everyValueIsEmpty([project, dataCenter, application, resource, jobCode]),
        then: Yup.array().required(),
        otherwise: Yup.array(),
      }),
    startDate: Yup.date().label('Start Date').required(),
    endDate: Yup.date().label('End Date').required(),
  },
  [
    ['project', 'application'],
    ['dataCenter', 'application'],
    ['dataCenter', 'project'],
    ['resource', 'project'],
    ['resource', 'application'],
    ['resource', 'dataCenter'],
    ['jobCode', 'project'],
    ['jobCode', 'application'],
    ['jobCode', 'dataCenter'],
    ['jobCode', 'resource'],
    ['tags', 'project'],
    ['tags', 'dataCenter'],
    ['tags', 'application'],
    ['tags', 'resource'],
    ['tags', 'jobCode'],
  ],
);

const startDate = new Date(new Date().toDateString());
startDate.setMonth(startDate.getMonth() - 1);
const endDate = new Date(new Date().toDateString());

interface BillingFilterProps {
  onSubmit: (values: Values, formikHelpers: any) => void | Promise<any>;
  option: any;
}

const BillingFilter = (props: BillingFilterProps) => {
  const { onSubmit, option } = props;

  const [projectOptions, setProjectOptions] = useState<Option[]>([]);
  const [dataCenterOptions, setDataCenterOptions] = useState<Option[]>([]);
  const [applicationOptions, setApplicationOptions] = useState<Option[]>([]);
  const [resourceOptions, setResourceOptions] = useState<Option[]>([]);
  const [jobCodeOptions, setJobCodeOptions] = useState<Option[]>([]);
  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  const initialValues = {
    project: undefined,
    application: undefined,
    jobCode: undefined,
    dataCenter: undefined,
    resource: undefined,
    tags: undefined,
    startDate,
    endDate,
  };

  useEffect(() => {
    if (!option) return;
    setProjectOptions(option.project);
    setDataCenterOptions(option.dataCenter);
    setApplicationOptions(option.application);
    setResourceOptions(option.name);
    setJobCodeOptions(option.jobCode);
    setTagOptions(option.tags);
  }, [option]);

  const handleOnSubmit = (
    values: Values,
    formikHelpers: FormikHelpers<{
      project: undefined;
      application: undefined;
      jobCode: undefined;
      dataCenter: undefined;
      resource: undefined;
      tags: undefined;
      startDate: Date;
      endDate: Date;
    }>,
  ): void => {
    onSubmit(
      {
        ...values,
        endDate: DateTime.fromJSDate(values.endDate).endOf('day').toJSDate(),
      },
      formikHelpers,
    );
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleOnSubmit} validationSchema={billingFilterSchema}>
      <Form>
        <BillingFilterForm
          projectOptions={projectOptions}
          applicationOptions={applicationOptions}
          jobCodeOptions={jobCodeOptions}
          dataCenterOptions={dataCenterOptions}
          resourceOptions={resourceOptions}
          tagOptions={tagOptions}
        />
      </Form>
    </Formik>
  );
};

export default BillingFilter;

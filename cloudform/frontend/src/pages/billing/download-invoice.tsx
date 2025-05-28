import 'react-month-picker-input/dist/react-month-picker-input.css';

import { Button, Column, Columns, Label } from 'bloomer';
import { Field, FieldProps, Form, Formik, useFormikContext } from 'formik';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import MonthPickerInput from 'react-month-picker-input';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import inventoryApi from '../../api/inventory';
import invoicesApi from '../../api/invoices';
import organizationApi, { OrganizationResponse } from '../../api/organization';
import { Divider } from '../../components';
import { DeferRender } from '../../components';
import { ErrorMessage, Input } from '../../components/formik';
import { enqueue } from '../../redux/snackbar';
import { everyValueIsEmpty, someValueIsNotEmpty } from '../../utils';
import { CustomSelect } from './custom-select';

interface Option {
  label: string;
  value: string | number;
}

interface DownloadInvoiceProps {
  project?: string;
  application?: string;
  jobCode?: string;
  organizationId?: number;
  period: {
    month: string;
    year: string;
  };
  tags?: string[];
  email: string;
}

const DownloadForm = (props: {
  projectOptions: Option[];
  applicationOptions: Option[];
  jobCodeOptions: Option[];
  orgOptions: Option[];
  tagOptions: Option[];
}) => {
  const { projectOptions, applicationOptions, jobCodeOptions, orgOptions, tagOptions } = props;
  const { values } = useFormikContext<DownloadInvoiceProps>();

  return (
    <>
      <Divider dataContent="Please fill in the form to generate an invoice" />
      <Columns>
        <Column>
          <Label>Project name</Label>
          <Field
            className="custom-select"
            name="project"
            options={projectOptions}
            component={CustomSelect}
            placeholder="Project"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<DownloadInvoiceProps>(values, ['application', 'jobCode', 'tags'])}
            isClearable
          />
          <ErrorMessage name="project" />
        </Column>
        <Column>
          <Label>Application</Label>
          <Field
            className="custom-select"
            name="application"
            options={applicationOptions}
            component={CustomSelect}
            placeholder="Application"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<DownloadInvoiceProps>(values, ['project', 'jobCode', 'tags'])}
            isClearable
          />
          <ErrorMessage name="application" />
        </Column>
        <Column>
          <Label>Job code</Label>
          <Field
            className="custom-select"
            name="jobCode"
            options={jobCodeOptions}
            component={CustomSelect}
            placeholder="Job code"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<DownloadInvoiceProps>(values, ['project', 'application', 'tags'])}
            isClearable
          />
          <ErrorMessage name="jobCode" />
        </Column>
        <Column>
          <Label>Tags</Label>
          <Field
            className="custom-select"
            name="tags"
            options={tagOptions}
            component={CustomSelect}
            placeholder="Tags"
            autoSubmit={false}
            isDisabled={someValueIsNotEmpty<DownloadInvoiceProps>(values, ['project', 'application', 'jobCode'])}
            isClearable
            isMulti
          />
          <ErrorMessage name="tags" />
        </Column>
      </Columns>
      <Columns>
        <Column>
          <Label>Period</Label>
          <Field name={'period'}>
            {({ field, form }: FieldProps) => {
              return (
                <MonthPickerInput
                  inputProps={{
                    className: 'input',
                    name: field.name,
                  }}
                  closeOnSelect
                  onChange={function (maskedValue: string, selectedYear: number, selectedMonth: number) {
                    form.setFieldValue('period', {
                      month: selectedMonth.toString(),
                      year: selectedYear.toString(),
                    });
                  }}
                  year={+field.value.year}
                  month={+field.value.month}
                />
              );
            }}
          </Field>
          <ErrorMessage name="period" />
        </Column>
        <Column>
          <Label>Organization</Label>
          <Field
            className="custom-select"
            name="organizationId"
            options={orgOptions}
            component={CustomSelect}
            placeholder="Organization"
            autoSubmit={false}
            isClearable
          />
          <ErrorMessage name="organizationId" />
        </Column>
        <Column>
          <Label>Email</Label>
          <Input type={'text'} name="email" />
          <ErrorMessage name="email" />
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

const downloadInvoiceSchema = Yup.object().shape(
  {
    project: Yup.string()
      .label('Project')
      .when(['application', 'jobCode', 'tags'], {
        is: (application, jobCode, tags) => everyValueIsEmpty([application, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    application: Yup.string()
      .label('Application')
      .when(['project', 'jobCode', 'tags'], {
        is: (project, jobCode, tags) => everyValueIsEmpty([project, jobCode, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    jobCode: Yup.string()
      .label('Job code')
      .when(['project', 'application', 'tags'], {
        is: (project, application, tags) => everyValueIsEmpty([project, application, tags]),
        then: Yup.string().required(),
        otherwise: Yup.string(),
      }),
    tags: Yup.array()
      .label('Tags')
      .when(['project', 'application', 'jobCode'], {
        is: (project, application, jobCode) => everyValueIsEmpty([project, application, jobCode]),
        then: Yup.array().required(),
        otherwise: Yup.array(),
      }),
    organizationId: Yup.number().label('Organization').required(),
    period: Yup.object().shape({
      month: Yup.string().label('Period month').required(),
      year: Yup.string().label('Period year').required(),
    }),
    email: Yup.string().label('Email').email().required(),
  },
  [
    ['project', 'application'],
    ['jobCode', 'project'],
    ['jobCode', 'application'],
    ['tags', 'project'],
    ['tags', 'application'],
    ['tags', 'jobCode'],
  ],
);

function DownloadInvoice() {
  const dispatch = useDispatch();
  const transformPeriodMonth = (month: number) => {
    return (month + 1).toLocaleString(undefined, {
      minimumIntegerDigits: 2,
    });
  };

  const handleOnSubmit = (data: DownloadInvoiceProps) => {
    const body = {
      ...data,
      project: data.project || null,
      application: data.application || null,
      jobCode: data.jobCode || null,
      tags: data.tags || [],
      period: {
        month: transformPeriodMonth(+data.period.month),
        year: data.period.year,
      },
    };
    invoicesApi(dispatch)
      .downloadInvoice(body)
      .then(() => {
        dispatch(enqueue(`Invoice has been sent to ${data.email}.`, 'success'));
      })
      .catch(() => {
        dispatch(enqueue('Error while generating an invoice.', 'danger'));
      });
  };

  const getOptionLoader = React.useMemo(() => {
    return inventoryApi(dispatch).getOptions();
  }, [dispatch]);

  const orgOptionsloader = React.useMemo(() => {
    return organizationApi(dispatch).get();
  }, [dispatch]);

  return (
    <DeferRender
      promise={Promise.all([getOptionLoader, orgOptionsloader])}
      render={([getOptionLoader, orgOptionsloader]) => (
        <InvoiceDetail handleOnSubmit={handleOnSubmit} option={getOptionLoader} orgOptionsloader={orgOptionsloader} />
      )}
    />
  );
}

type InvoiceDetailProps = {
  handleOnSubmit: (data: DownloadInvoiceProps) => void;
  option: any;
  orgOptionsloader: OrganizationResponse;
};

const InvoiceDetail: React.FC<InvoiceDetailProps> = (props) => {
  const { handleOnSubmit, orgOptionsloader, option } = props;
  const date = new Date();
  const curMonth = date.getMonth().toString();
  const curYear = date.getFullYear().toString();

  const [projectOptions, setProjectOptions] = useState<Option[]>([]);
  const [applicationOptions, setApplicationOptions] = useState<Option[]>([]);
  const [jobCodeOptions, setJobCodeOptions] = useState<Option[]>([]);
  const [orgOptions, setOrgOptions] = useState<Option[]>([]);
  const [tagOptions, setTagOptions] = useState<Option[]>([]);

  useEffect(() => {
    if (!option) return;
    setProjectOptions(option.project);
    setApplicationOptions(option.application);
    setJobCodeOptions(option.jobCode);
    setTagOptions(option.tags);
  }, [option]);

  useEffect(() => {
    if (!orgOptionsloader) return;
    const organizationOptions = orgOptionsloader.map((org) => {
      return {
        label: org.tenantName,
        value: org.id,
      };
    });
    setOrgOptions(organizationOptions);
  }, [orgOptionsloader]);
  return (
    <>
      <Formik
        initialValues={{
          project: undefined,
          application: undefined,
          jobCode: undefined,
          organizationId: undefined,
          period: {
            month: curMonth,
            year: curYear,
          },
          tags: undefined,
          email: '',
        }}
        onSubmit={handleOnSubmit}
        validationSchema={downloadInvoiceSchema}
      >
        <Form>
          <DownloadForm
            projectOptions={projectOptions}
            applicationOptions={applicationOptions}
            jobCodeOptions={jobCodeOptions}
            orgOptions={orgOptions}
            tagOptions={tagOptions}
          />
        </Form>
      </Formik>
    </>
  );
};

export default DownloadInvoice;

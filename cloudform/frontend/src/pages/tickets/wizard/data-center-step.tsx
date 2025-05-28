import { Button, Field, Label, Title } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';

import dataCenterApi, { DataCenterProperty } from '../../../api/data-center';
import jobCodeApi from '../../../api/job-code';
import { DeferRender } from '../../../components';
import { ErrorMessage, Input, Select } from '../../../components/formik';
import { enqueue } from '../../../redux/snackbar';
import { ApplicationState } from '../../../redux/state';
import { setDataCenter, TicketWizardProperty } from '../../../redux/ticket-wizard';
import JobCodeModal from '../../projects/modal';

interface DataCenterValues {
  dataCenter: string;
  jobCode: string;
}

interface DataCenterFormProps {
  initialValues: DataCenterValues;
  dataCenterChoices: DataCenterProperty[];
  onSubmit: (values: DataCenterValues, actions: FormikHelpers<DataCenterValues>) => void;
}

const schema = Yup.object().shape({
  dataCenter: Yup.number().label('Data center').required(),
  jobCode: Yup.string().label('Job code').required().matches(/\d+/, 'Job code should be number.').min(10).max(25),
});

const DataCenterForm: React.FC<DataCenterFormProps> = ({ initialValues, onSubmit, dataCenterChoices }) => (
  <Formik initialValues={initialValues} validationSchema={schema} onSubmit={onSubmit}>
    {({ isSubmitting, setFieldValue, values }) => {
      if (dataCenterChoices.length > 0 && values.dataCenter == null) {
        setFieldValue('dataCenter', dataCenterChoices[0].id.toString());
      }

      return (
        <Form id="data-center-form">
          <Field>
            <Label>Datacenter</Label>
            <Select
              name="dataCenter"
              isFullwidth
              onChange={(e) => {
                const dataCenterId = e.currentTarget.value;
                const dataCenter = dataCenterChoices.find((dataCenter) => dataCenter.id.toString() === dataCenterId);
                const defaultJobCode = (dataCenter && dataCenter.defaultJobCode) || '';
                setFieldValue('dataCenter', dataCenterId);
                setFieldValue('jobCode', defaultJobCode);
              }}
            >
              {dataCenterChoices.map((dataCenter) => (
                <option value={dataCenter.id} key={dataCenter.id}>
                  {dataCenter.name}
                </option>
              ))}
            </Select>
            <ErrorMessage name="dataCenter" />
          </Field>

          <Field>
            <Label>
              <span>Job code</span>&nbsp;
              <small className={'is-size-7 has-text-success'}>for charging resource cost.</small>
            </Label>
            <Input name="jobCode" />
            <ErrorMessage name="jobCode" />
          </Field>
          <br />
          <Field>
            <Button type="submit" data-action="proceed" isLoading={isSubmitting} isColor="primary">
              Next
            </Button>
          </Field>
        </Form>
      );
    }}
  </Formik>
);

interface DataCenterStepProps {
  dataCenter: number | undefined;
  jobCode: string | undefined;
  dataCenterChoices: DataCenterProperty[];
  promptChange?: boolean;
  onNext: (dataCenter: DataCenterProperty, jobCode: string) => void;
}

const DataCenterStep: React.FC<DataCenterStepProps> = (props) => {
  const { dataCenter, jobCode, dataCenterChoices, onNext } = props;
  const initialValues = React.useMemo(() => {
    return {
      dataCenter: dataCenter !== undefined ? dataCenter.toString() : dataCenterChoices[0].id.toString(),
      jobCode: jobCode || '',
    };
  }, [dataCenterChoices, dataCenter, jobCode]);
  const [modalIsOpen, setIsOpen] = React.useState<boolean>(false);
  const [formikDateCenter, setFormikDateCenter] = React.useState<FormikHelpers<DataCenterValues>>();
  const [dataCenterRequest, setDataCenterRequest] = React.useState<DataCenterValues | undefined>(undefined);
  const dispatch = useDispatch();

  const onSubmit = (values: DataCenterValues, actions: FormikHelpers<DataCenterValues>) => {
    jobCodeApi(dispatch)
      .get(values.jobCode)
      .then(() => {
        setFormikDateCenter(actions);
        setDataCenterRequest(values);
        setIsOpen(true);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        dispatch(enqueue(err.details, 'danger'));
      });
  };

  const onConfirm = (values: DataCenterValues, actions: FormikHelpers<DataCenterValues>) => {
    const newDataCenter = dataCenterChoices.find((dataCenter) => values.dataCenter === dataCenter.id.toString());

    if (newDataCenter == null) return;

    const newJobCode = values.jobCode;
    let confirm = true;
    if (props.promptChange && (newDataCenter.id !== dataCenter || newJobCode !== jobCode)) {
      confirm = window.confirm(
        'Ticket related to resources in the data center will disappear. Are you sure to change data center?',
      );
    }

    if (confirm) {
      onNext(newDataCenter, newJobCode);
    } else {
      actions.setSubmitting(false);
    }
  };

  const onCancel = () => {
    if (formikDateCenter) {
      formikDateCenter.setSubmitting(false);
    }
    setIsOpen(false);
  };

  return (
    <>
      <JobCodeModal
        meta={formikDateCenter}
        modalIsOpen={modalIsOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
        dataCenterRequest={dataCenterRequest}
        jobCodeNo={dataCenterRequest?.jobCode}
      />
      <Title isSize={4}>Data center for resources</Title>
      <DataCenterForm initialValues={initialValues} onSubmit={onSubmit} dataCenterChoices={dataCenterChoices} />
    </>
  );
};

const DataCenterStepPage: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const ticket = useSelector<ApplicationState, TicketWizardProperty>((state) => state.ticketWizard.ticket!);

  const dataCenter = ticket.dataCenter ? ticket.dataCenter.id : undefined;
  const jobCode = ticket.jobCode;

  const promptChange = ticket.dataCenter !== undefined && ticket.jobCode !== undefined && ticket.items.length > 0;

  const dispatch = useDispatch();
  const dataCenterLoader = React.useMemo(() => {
    return dataCenterApi(dispatch)
      .list()
      .then((resp) => resp.results);
  }, [dispatch]);

  const handleSubmit = React.useCallback(
    (dataCenter: DataCenterProperty, jobCode: string) => {
      dispatch(setDataCenter(dataCenter, jobCode));
      onNext();
    },
    [dispatch, onNext],
  );

  return (
    <DeferRender
      promise={dataCenterLoader}
      render={(dataCenterChoices) => (
        <DataCenterStep
          dataCenter={dataCenter}
          jobCode={jobCode}
          dataCenterChoices={dataCenterChoices}
          promptChange={promptChange}
          onNext={handleSubmit}
        />
      )}
    />
  );
};

export default DataCenterStepPage;
export { DataCenterStep };

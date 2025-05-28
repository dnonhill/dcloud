import {
  Button,
  Control,
  Delete,
  Field,
  Icon,
  Label,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
} from 'bloomer';
import { Form, Formik } from 'formik';
import { FormikHelpers } from 'formik/dist/types';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import projectApi, { LOCAL_DOMAIN, TransferOwnerRequest } from '../../api/project';
import userDomainApi, { UserDomainProperty } from '../../api/userdomain';
import { Modal } from '../../components';
import { ErrorMessage, Input, Select } from '../../components/formik';
import { compactDetails } from '../../redux/api/error';

interface TransferOwnerProps {
  isActive: boolean;
  onTransferSuccess: () => void;
  projectId: number;
  onClose: () => void;
  errors?: any;
}

const transferOwnerSchema = Yup.object().shape({
  domain: Yup.string().label('Domain').required(),
  username: Yup.string().label('Username').required(),
});

const initialValues: TransferOwnerRequest = {
  domain: 'pttdigital',
  isLocal: false,
  username: '',
};

const TransferOwnerDialog: React.FC<TransferOwnerProps> = (props) => {
  const dispatch = useDispatch();
  const [userDomainList, setUserDomainList] = useState<UserDomainProperty[]>([]);

  useEffect(() => {
    userDomainApi(dispatch).list().then(setUserDomainList);
  }, [dispatch, setUserDomainList]);

  const onSubmit = (values: TransferOwnerRequest, meta: FormikHelpers<TransferOwnerRequest>) => {
    projectApi(dispatch)
      .transferOwner(props.projectId, values)
      .then(() => {
        props.onTransferSuccess();
        props.onClose();
      })
      .catch((err) => {
        const errorMessage = compactDetails(err.details.newOwner);
        if ('nonFieldErrors' in err.details.newOwner)
          (errorMessage as any).username = err.details.newOwner.nonFieldErrors[0];
        meta.setErrors(errorMessage);
      })
      .finally(() => meta.setSubmitting(false));
  };

  return (
    <Modal isActive={props.isActive}>
      <ModalCard>
        <ModalCardHeader>
          <ModalCardTitle>Transfer project</ModalCardTitle>
          <Delete onClick={props.onClose} />
        </ModalCardHeader>
        <Formik initialValues={initialValues} onSubmit={onSubmit} validationSchema={transferOwnerSchema}>
          <Form>
            <ModalCardBody className="has-text-left">
              <Field>
                <Label>Domain</Label>
                <Control>
                  <Select name="domain">
                    {userDomainList.map((item) => (
                      <option value={item.name} key={item.name}>
                        {item.displayName}
                      </option>
                    ))}
                    <option value={LOCAL_DOMAIN}>Other</option>
                  </Select>
                </Control>
                <ErrorMessage name="domain" />
              </Field>

              <Field>
                <Label>Username</Label>
                <Control>
                  <Input name="username" />
                </Control>
                <ErrorMessage name="username" />
              </Field>
            </ModalCardBody>
            <ModalCardFooter>
              <Button type="submit" isColor="primary">
                Transfer
              </Button>
              <Button onClick={props.onClose}>Cancel</Button>
            </ModalCardFooter>
          </Form>
        </Formik>
      </ModalCard>
    </Modal>
  );
};

interface ModalDialogProps {
  className?: string;
  setVisibility: (val: boolean) => void;
}

const TransferProjectButton: React.FC<ModalDialogProps> = (props) => {
  return (
    <a href="#/" role="button" onClick={() => props.setVisibility(true)} className={props.className}>
      <Icon className="fas fa-exchange-alt" />
      <span>Transfer ownership</span>
    </a>
  );
};

export { TransferOwnerDialog, TransferProjectButton };

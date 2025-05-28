import { Button, Control, Field, Icon, Label, Title } from 'bloomer';
import { Form, Formik, FormikProps } from 'formik';
import * as React from 'react';
import * as Yup from 'yup';

import { BackButton } from '../../../../../components';
import { ErrorMessage, Input } from '../../../../../components/formik';
import FocusError from '../../../../../components/formik/error-focus';
import { RESOURCE_TYPE_CONTAINER } from '../../../../../resource-type';
import PricingPanel from '../../../../pricing/pricing';
import { ContainerSpecification } from '../../../resource-spec';
import { FormProps } from './types';

const MAX_MEMBERS = 10;

const containerSchema = Yup.object().shape({
  namespace: Yup.string()
    .label('Project name')
    .required()
    .min(2)
    .max(32)
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Project name should be lower characters, digit or -'),
  cpu: Yup.number().label('vCPU').required().min(1).max(64).integer(),
  memory: Yup.number().label('Memory').required().min(1).max(256).integer(),
  mainStorage: Yup.number().label('Storage').required().min(0).max(2048).integer(),
  members: Yup.array()
    .label('Members')
    .of(
      Yup.string()
        .label('Username')
        .required()
        .min(3)
        .max(25)
        .strip(true)
        .matches(/^[A-z0-9.]*$/, 'Username should container only character or number.'),
    )
    .min(1)
    .max(MAX_MEMBERS),
});

export const defaultValues: ContainerSpecification = {
  namespace: '',
  cpu: 2,
  memory: 4,
  mainStorage: 10,
  members: [''],
};

const ContainerForm: React.FC<FormProps & { isPriceCalculator: boolean }> = (props) => {
  const { initialValues = defaultValues, onSubmit, mode, isPriceCalculator } = props;

  if (isPriceCalculator) {
    initialValues.members = ['priceCalculator'];
  } else if (initialValues.members[0] === '' || initialValues.members[0] === 'priceCalculator') {
    initialValues.members = [''];
  }

  return (
    <>
      <Title isSize={5}>Design Openshift project</Title>
      <Formik initialValues={initialValues} validationSchema={containerSchema} onSubmit={onSubmit}>
        {(props) => (
          <Form>
            <Field>
              <Label>Project name</Label>
              <Input name="namespace" disabled={mode === 'edit'} />
              <ErrorMessage name="namespace" />
            </Field>

            <div className="is-divider" data-content="Resource quota" />
            <ResourceSection {...props} />

            {isPriceCalculator ? (
              ''
            ) : (
              <>
                <div className="is-divider" data-content="Project membership" />
                <ProjectMembershipSection {...props} />
              </>
            )}

            <hr />

            <PricingPanel item={{ resourceType: RESOURCE_TYPE_CONTAINER, specification: props.values }} />

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
            <br />
            <FocusError />
          </Form>
        )}
      </Formik>
    </>
  );
};

export const ResourceSection: React.FC<FormikProps<ContainerSpecification>> = (props) => {
  return (
    <>
      <Field>
        <Label>vCPU (cores)</Label>
        <Input name="cpu" type="number" />
        <ErrorMessage name="cpu" />
      </Field>

      <Field>
        <Label>Memory (GB)</Label>
        <Input name="memory" type="number" />
        <ErrorMessage name="memory" />
      </Field>

      <Field>
        <Label>Storage (GB)</Label>
        <Input name="mainStorage" type="number" />
        <ErrorMessage name="mainStorage" />
      </Field>
    </>
  );
};
const ProjectMembershipSection: React.FC<FormikProps<ContainerSpecification>> = (props) => {
  const addMember = () => {
    const members = props.values.members || [];
    if (members.length >= MAX_MEMBERS) return;
    props.setFieldValue('members', members.concat(['']));
  };
  const removeMember = (index: number) => {
    const members = props.values.members || [];
    props.setFieldValue(
      'members',
      members.filter((member, i) => i !== index),
    );
  };

  const canAddMember = (props.values.members || []).length < MAX_MEMBERS;

  return (
    <>
      <Label>Members</Label>
      {(props.values.members || []).map((member, i) => (
        <Field hasAddons key={i}>
          <Control>
            <Button isStatic>PTTGRP</Button>
          </Control>
          <Control isExpanded>
            <Input type="text" placeholder="Username" name={`members[${i}]`} />
          </Control>
          <Control>
            <Button onClick={() => removeMember(i)}>
              <Icon className="fas fa-times" />
            </Button>
          </Control>
          <ErrorMessage name={`members[${i}]`} className="is-fullflex" />
        </Field>
      ))}
      <Field>
        <Button onClick={addMember} disabled={!canAddMember}>
          <Icon className="fas fa-user-plus" />
          <span>Add member</span>
        </Button>
      </Field>
    </>
  );
};
export default ContainerForm;

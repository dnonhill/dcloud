import { Button, Control, Field, Label, Title } from 'bloomer';
import { Form, Formik, FormikHelpers } from 'formik';
import React from 'react';
import { useRouteMatch } from 'react-router';
import Select, { OptionTypeBase } from 'react-select';

import { CreateResourceRelationProperty, ServiceInventoryProperty } from '../../../api/resource';
import { BackButton, LinkButton } from '../../../components';
import { ErrorMessage, Input } from '../../../components/formik';

type AddRelationFormProps = {
  resourceId: string;
  relation: string;
  serviceInventoryList: ServiceInventoryProperty[];
  onSubmit: (data: AppRelationFormState, actions: FormikHelpers<AppRelationFormState>) => void;
};

export type AppRelationFormState = Omit<CreateResourceRelationProperty, 'serviceInventory'> & {
  serviceInventory: ServiceInventoryProperty | null;
};

export const AddRelationForm: React.FC<AddRelationFormProps> = (props) => {
  const initialValues: AppRelationFormState = {
    resource: parseInt(props.resourceId),
    relation: props.relation,
    description: '',
    serviceInventory: null,
  };

  const { serviceInventoryList } = props;
  const serviceOptions = React.useMemo(() => serviceInventoryList.map((val) => ({ value: val.id, label: val.name })), [
    serviceInventoryList,
  ]);

  return (
    <>
      <Formik initialValues={initialValues} onSubmit={props.onSubmit}>
        {({ setFieldValue, values }) => {
          const serviceId = values.serviceInventory == null ? 0 : values.serviceInventory.id;

          return (
            <Form>
              <Title>Add Resource relation</Title>
              <Field>
                <Label>Direction</Label>
                <span>{props.relation.toUpperCase()}</span>
              </Field>
              <Field>
                <Label>Service</Label>
                <Control>
                  <Select
                    name="serviceInventory"
                    value={{ value: serviceId, label: values.serviceInventory ? values.serviceInventory.name : '' }}
                    options={serviceOptions}
                    placeholder="Select related service..."
                    onChange={(v) =>
                      setFieldValue(
                        'serviceInventory',
                        v && serviceInventoryList.find((item) => item.id === (v as OptionTypeBase).value),
                      )
                    }
                  />
                </Control>
                <p className="help is-success">{values.serviceInventory ? values.serviceInventory.description : ''}</p>
              </Field>
              <Field>
                <Label>Description</Label>
                <Input name="description" />
                <ErrorMessage name="description" />
              </Field>

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
          );
        }}
      </Formik>
    </>
  );
};

export const NewResourceRelationButton: React.FC<{ relation: string }> = ({ relation }) => {
  const match = useRouteMatch()!;
  return (
    <LinkButton
      to={`${match.url}/add-${relation}`}
      icon="fa fa-plus"
      isColor="info"
      isSize="small"
      data-action="new-resource-relation"
    >
      <span>Add Relation</span>
    </LinkButton>
  );
};

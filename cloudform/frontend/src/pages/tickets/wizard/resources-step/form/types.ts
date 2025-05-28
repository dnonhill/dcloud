export interface FormProps {
  onSubmit: (values: any) => void;
  initialValues?: any;
  mode: 'edit' | 'create';
}

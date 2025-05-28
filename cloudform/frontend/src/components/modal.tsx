import { Modal as BloomerModal, ModalBackground } from 'bloomer';
import { Modal as BloomerModalProps } from 'bloomer/lib/components/Modal/Modal';
import * as React from 'react';

type ModalProps = BloomerModalProps<HTMLDivElement> & {
  isActive: boolean;
};

const Modal: React.FC<ModalProps> = (props) => (
  <BloomerModal isActive={props.isActive}>
    <ModalBackground />
    {props.children}
  </BloomerModal>
);

export { Modal };

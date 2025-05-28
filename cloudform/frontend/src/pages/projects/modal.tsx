import {
  Button,
  Modal,
  ModalBackground,
  ModalCard,
  ModalCardBody,
  ModalCardFooter,
  ModalCardHeader,
  ModalCardTitle,
} from 'bloomer';
import { FormikHelpers } from 'formik';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

// import Modal from 'react-modal';
import jobCodeApi, { JobCodeResponse } from '../../api/job-code';
import { ProjectRequest } from '../../api/project';
import { Divider } from '../../components';
import { displayDate, displayJSDate } from '../../formatter/date';
import { enqueue } from '../../redux/snackbar';

// const customStyles = {
//   content: {
//     top: '50%',
//     left: '50%',
//     right: 'auto',
//     bottom: 'auto',
//     marginRight: '-50%',
//     transform: 'translate(-50%, -50%)',
//     width: '40%',
//     maxWidth: '40%',
//     minWidth: '25%',
//   },
//   overlay: { zIndex: 1000 },
// };

interface DataCenterValues {
  dataCenter: string;
  jobCode: string;
}

interface Props {
  meta?: FormikHelpers<ProjectRequest> | FormikHelpers<DataCenterValues>;
  projectRequest?: ProjectRequest | undefined;
  dataCenterRequest?: DataCenterValues;
  modalIsOpen: boolean;
  onConfirm: (values: any, meta: any) => void;
  onCancel: () => void;
  jobCode?: JobCodeResponse;
  jobCodeNo?: string;
  modalTitle?: string;
  modalConfirmText?: string;
  modalCancelText?: string;
}

// Modal.setAppElement('#root');
const JobCodeModal: React.FC<Props> = ({
  meta,
  projectRequest,
  dataCenterRequest,
  modalIsOpen,
  onConfirm,
  onCancel,
  jobCodeNo,
  modalTitle = 'Project confirm',
  modalConfirmText = 'Confirm',
  modalCancelText = 'Cancel',
}: Props) => {
  const dispatch = useDispatch();
  const [jobCodeDetail, setJobCodeDetail] = useState<JobCodeResponse>();

  useEffect(() => {
    if (modalIsOpen) {
      jobCodeApi(dispatch)
        .get(jobCodeNo)
        .then((res) => {
          setJobCodeDetail(res);
        })
        .catch((err) => {
          onCancel();
          dispatch(enqueue(err.details || 'Could not get job code detail.', 'danger'));
        });
    }
  }, [dispatch, jobCodeNo, modalIsOpen, onCancel]);
  return (
    <Modal isActive={modalIsOpen}>
      {jobCodeDetail && jobCodeNo && (
        <>
          <ModalBackground />
          <ModalCard>
            <ModalCardHeader>
              <ModalCardTitle>{modalTitle}</ModalCardTitle>
            </ModalCardHeader>
            <ModalCardBody>
              <div className="columns">
                <div className="column has-text-centered">
                  <p className="title is-6 has-text-weight-bold">รหัส Job code</p>
                  <p className="title is-5 has-text-weight-bold has-text-primary">{jobCodeNo}</p>
                </div>
                <div className="column has-text-centered">
                  <p className="title is-6 has-text-weight-bold">ชื่อ Job code</p>
                  <p className="title is-5 has-text-weight-bold has-text-primary">{jobCodeDetail.description}</p>
                </div>
              </div>
              {projectRequest && (
                <>
                  <Divider dataContent="Project Detail" />
                  <div className="columns">
                    <div className="column">
                      <p className="title is-6 has-text-right">Project name</p>
                    </div>
                    <div className="column">
                      <p className="is-6">{projectRequest.name}</p>
                    </div>
                  </div>
                  <div className="columns">
                    <div className="column">
                      <p className="title is-6 has-text-right">Go Live Date</p>
                    </div>
                    <div className="column">
                      {projectRequest.goLiveDate && (
                        <p className="is-6">{displayJSDate(new Date(projectRequest.goLiveDate))}</p>
                      )}
                    </div>
                  </div>
                  <div className="columns">
                    <div className="column">
                      <p className="title is-6 has-text-right">Expired date</p>
                    </div>
                    <div className="column">
                      {projectRequest.expiredDate && (
                        <p className="is-6">{displayJSDate(new Date(projectRequest.expiredDate))}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <Divider dataContent="Job Code Detail" />
              {/* <p className="title is-4" style={{ textAlign: 'center' }}>
              Job code detail
            </p> */}
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">หน่วยงานเจ้าของงบประมาณ Job code</p>
                </div>
                <div className="column">
                  <p className="is-6">{jobCodeDetail.requestcctr}</p>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">หน่วยงานผู้รับผิดชอบ Job code</p>
                </div>
                <div className="column">
                  <p className="is-6">{jobCodeDetail.respCostCenter}</p>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">ประเภท Job code</p>
                </div>
                <div className="column">
                  <p className="is-6">{jobCodeDetail.auart}</p>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">วันที่เริ่มต้น Job code</p>
                </div>
                <div className="column">
                  {jobCodeDetail.startDate && <p className="is-6">{displayDate(jobCodeDetail.startDate.toString())}</p>}
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right"> วันที่สิ้นสุด Job code</p>
                </div>
                <div className="column">
                  {jobCodeDetail.endDate && <p className="is-6">{displayDate(jobCodeDetail.endDate.toString())}</p>}
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">Customer Code</p>
                </div>
                <div className="column">
                  <p className="is-6">{jobCodeDetail.descZcoOrcus}</p>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <p className="title is-6 has-text-right">Techno/Product</p>
                </div>
                <div className="column">
                  <p className="is-6">{jobCodeDetail.descZcoOrprt}</p>
                </div>
              </div>
            </ModalCardBody>
            <ModalCardFooter>
              {(projectRequest || dataCenterRequest) && meta && (
                <Button isColor="primary" onClick={() => onConfirm(projectRequest || dataCenterRequest, meta)}>
                  {modalConfirmText}
                </Button>
              )}
              <Button onClick={onCancel} isColor="light" style={{ marginLeft: '4%' }}>
                {modalCancelText}
              </Button>
            </ModalCardFooter>
          </ModalCard>
        </>
      )}
    </Modal>
  );
};

export default JobCodeModal;

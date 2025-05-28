import { Page, PageEllipsis, PageLink, PageList, Pagination } from 'bloomer';
import _ from 'lodash';
import * as React from 'react';

import { PaginationOption } from '../api/list-options';
import { PaginatedResponse } from '../api/pagination';

interface PaginationSectionProps {
  currentPage: number;
  totalPage: number;
  onPageChoose?: (page: number) => void;
}

type PageButtonProps = Pick<PaginationSectionProps, 'onPageChoose'> & {
  myPage: number;
  currentPage: number;
};

const PageButton: React.FC<PageButtonProps> = (props) => (
  <PageLink
    onClick={() => props.onPageChoose && props.onPageChoose(props.myPage)}
    isCurrent={props.myPage === props.currentPage}
  >
    {props.myPage + 1}
  </PageLink>
);

const PaginationSection: React.FC<PaginationSectionProps> = (props) => {
  const { currentPage, totalPage, onPageChoose } = props;
  if (totalPage < 2) {
    return <></>;
  }

  const start = Math.max(currentPage - 3, 0);
  const end = Math.min(currentPage + 4, totalPage);

  return (
    <>
      <br />
      <Pagination isAlign="centered">
        <PageList>
          {start > 0 && (
            <>
              <Page>
                <PageButton myPage={0} currentPage={currentPage} onPageChoose={onPageChoose} />
              </Page>
              <Page>
                <PageEllipsis />
              </Page>
            </>
          )}
          {_.range(start, end).map((page) => (
            <Page key={page}>
              <PageButton myPage={page} currentPage={currentPage} onPageChoose={onPageChoose} />
            </Page>
          ))}
          {end < totalPage && (
            <>
              <Page>
                <PageEllipsis />
              </Page>
              <Page>
                <PageButton myPage={totalPage - 1} currentPage={currentPage} onPageChoose={onPageChoose} />
              </Page>
            </>
          )}
        </PageList>
      </Pagination>
    </>
  );
};

interface PaginationContainerProps<T> {
  itemPerPage: number;
  currentPage: number;
  response: PaginatedResponse<T>;
  onPageChange: (paginateParam: PaginationOption) => void;
}

function PaginationContainer<T>(props: PaginationContainerProps<T>) {
  const { itemPerPage, currentPage, response } = props;
  const totalPage = Math.ceil(response.count / itemPerPage);

  const onPageChoose = (newPage: number) => {
    props.onPageChange({ currentPage: newPage, itemPerPage: itemPerPage });
  };

  return <PaginationSection currentPage={currentPage} totalPage={totalPage} onPageChoose={onPageChoose} />;
}

export default PaginationContainer;

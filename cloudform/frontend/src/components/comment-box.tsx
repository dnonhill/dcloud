import { Card, CardContent, CardHeader, CardHeaderIcon, CardHeaderTitle } from 'bloomer';
import React from 'react';

import { ReviewBriefProperty } from '../api/review';
import { displayDateTime } from '../formatter/date';
import { CollapsibleBox, CollapsibleIcon } from '.';

interface CommentBoxProps {
  comments: ReviewBriefProperty[];
}

export const CommentBox: React.FC<CommentBoxProps> = (props) => {
  const { comments } = props;
  const commentWithNote = comments.filter((comment) => comment.note);

  return commentWithNote.length > 0 ? (
    <Card className="mb-4">
      <CollapsibleBox
        isOpen
        headerType={({ isOpen }) => (
          <CardHeader>
            <CardHeaderTitle className="has-text-primary" style={{ flexWrap: 'wrap' }}>
              <strong>Comment</strong>
            </CardHeaderTitle>
            <CardHeaderIcon>
              <CollapsibleIcon isOpen={isOpen} />
            </CardHeaderIcon>
          </CardHeader>
        )}
      >
        <CardContent>
          {commentWithNote.map((comment, index) => (
            <div key={comment.id}>
              <pre className="comment">{comment.note!}</pre>
              <p className={`has-text-grey is-size-7 mt-2 ${index !== comments.length - 1 ? 'mb-5' : ''}`}>
                Reviewed by <strong>{comment.reviewer.fullname}</strong> @{displayDateTime(comment.reviewedAt!)}
              </p>
            </div>
          ))}
        </CardContent>
      </CollapsibleBox>
    </Card>
  ) : (
    <></>
  );
};

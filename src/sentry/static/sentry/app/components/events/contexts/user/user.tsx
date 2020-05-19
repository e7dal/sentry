import React from 'react';

import UserAvatar from 'sentry/components/avatar/userAvatar';
import {AvatarUser as UserType} from 'sentry/types';
import {removeFilterMaskedEntries} from 'sentry/components/events/interfaces/utils';
import ContextBlock from 'sentry/components/events/contexts/contextBlock';
import ErrorBoundary from 'sentry/components/errorBoundary';
import KeyValueList from 'sentry/components/events/interfaces/keyValueList/keyValueList';
import {defined} from 'sentry/utils';

import getUserKnownData from './getUserKnownData';
import {UserKnownDataType} from './types';

type Props = {
  data: Data;
};

type Data = {
  data: {[key: string]: string};
} & UserType;

const userKnownDataValues = [
  UserKnownDataType.ID,
  UserKnownDataType.EMAIL,
  UserKnownDataType.USERNAME,
  UserKnownDataType.IP_ADDRESS,
  UserKnownDataType.NAME,
];

const User = ({data}: Props) => {
  const getKeyValueData = (val: object) => Object.keys(val).map(key => [key, val[key]]);

  return (
    <div className="user-widget">
      <div className="pull-left">
        <UserAvatar user={removeFilterMaskedEntries(data)} size={48} gravatar={false} />
      </div>
      <ContextBlock knownData={getUserKnownData(data, userKnownDataValues)} />
      {defined(data?.data) && (
        <ErrorBoundary mini>
          <KeyValueList data={getKeyValueData(data.data)} isContextData />
        </ErrorBoundary>
      )}
    </div>
  );
};

User.getTitle = () => 'User';

export default User;

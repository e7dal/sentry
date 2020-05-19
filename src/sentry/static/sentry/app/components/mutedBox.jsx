import PropTypes from 'prop-types';
import React from 'react';

import {BannerContainer, BannerSummary} from 'sentry/components/events/styles';
import DateTime from 'sentry/components/dateTime';
import Duration from 'sentry/components/duration';
import {t} from 'sentry/locale';
import theme from 'sentry/utils/theme';

export default class MutedBox extends React.PureComponent {
  static propTypes = {
    statusDetails: PropTypes.object.isRequired,
  };

  renderReason = () => {
    const details = this.props.statusDetails;
    if (details.ignoreUntil) {
      return t(
        'This issue has been ignored until %s',
        <strong>
          <DateTime date={details.ignoreUntil} />
        </strong>
      );
    } else if (details.ignoreCount && details.ignoreWindow) {
      return t(
        'This issue has been ignored until it occurs %s time(s) in %s',
        <strong>{details.ignoreCount.toLocaleString()}</strong>,
        <strong>
          <Duration seconds={details.ignoreWindow * 60} />
        </strong>
      );
    } else if (details.ignoreCount) {
      return t(
        'This issue has been ignored until it occurs %s more time(s)',
        <strong>{details.ignoreCount.toLocaleString()}</strong>
      );
    } else if (details.ignoreUserCount && details.ignoreUserWindow) {
      return t(
        'This issue has been ignored until it affects %s user(s) in %s',
        <strong>{details.ignoreUserCount.toLocaleString()}</strong>,
        <strong>
          <Duration seconds={details.ignoreUserWindow * 60} />
        </strong>
      );
    } else if (details.ignoreUserCount) {
      return t(
        'This issue has been ignored until it affects %s more user(s)',
        <strong>{details.ignoreUserCount.toLocaleString()}</strong>
      );
    }
    return t('This issue has been ignored');
  };

  render = () => (
    <BannerContainer priority="default">
      <BannerSummary>
        <span className="icon icon-soundoff" style={{color: theme.red}} />
        <span>
          {this.renderReason()}&nbsp;&mdash;&nbsp;
          {t(
            'You will not be notified of any changes and it will not show up by default in feeds.'
          )}
        </span>
      </BannerSummary>
    </BannerContainer>
  );
}

import PropTypes from 'prop-types';
import React from 'react';

import ConfigStore from 'sentry/stores/configStore';
import EventDataSection from 'sentry/components/events/eventDataSection';
import SentryTypes from 'sentry/sentryTypes';
import {t} from 'sentry/locale';
import CrashHeader from 'sentry/components/events/interfaces/crashHeader';
import CrashContent from 'sentry/components/events/interfaces/crashContent';

export function isStacktraceNewestFirst() {
  const user = ConfigStore.get('user');
  // user may not be authenticated
  const options = user ? user.options : {};
  switch (options.stacktraceOrder) {
    case 2:
      return true;
    case 1:
      return false;
    case -1:
    default:
      return true;
  }
}

class StacktraceInterface extends React.Component {
  static propTypes = {
    event: SentryTypes.Event.isRequired,
    type: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
    projectId: PropTypes.string.isRequired,
    hideGuide: PropTypes.bool,
  };

  static defaultProps = {
    hideGuide: false,
  };

  constructor(...args) {
    super(...args);
    this.state = {
      stackView: this.props.data.hasSystemFrames ? 'app' : 'full',
      newestFirst: isStacktraceNewestFirst(),
    };
  }

  toggleStack = value => {
    this.setState({
      stackView: value,
    });
  };

  render() {
    const {projectId, event, data, hideGuide} = this.props;
    const {stackView, newestFirst} = this.state;

    const title = (
      <CrashHeader
        title={t('Stacktrace')}
        platform={event.platform}
        stacktrace={data}
        stackView={stackView}
        newestFirst={newestFirst}
        hideGuide={hideGuide}
        onChange={newState => {
          this.setState(newState);
        }}
      />
    );

    return (
      <EventDataSection
        event={event}
        type={this.props.type}
        title={title}
        wrapTitle={false}
      >
        <CrashContent
          projectId={projectId}
          event={event}
          stackView={stackView}
          newestFirst={newestFirst}
          stacktrace={data}
        />
      </EventDataSection>
    );
  }
}

export default StacktraceInterface;

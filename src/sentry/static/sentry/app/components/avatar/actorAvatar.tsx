import React from 'react';
import PropTypes from 'prop-types';
import * as Sentry from '@sentry/browser';

import SentryTypes from 'sentry/sentryTypes';
import UserAvatar from 'sentry/components/avatar/userAvatar';
import TeamAvatar from 'sentry/components/avatar/teamAvatar';
import MemberListStore from 'sentry/stores/memberListStore';
import TeamStore from 'sentry/stores/teamStore';
import {Actor} from 'sentry/types';

type Props = {
  actor: Actor;
  size?: number;
  default?: string;
  title?: string;
  gravatar?: boolean;
  className?: string;
};

class ActorAvatar extends React.Component<Props> {
  static propTypes = {
    actor: SentryTypes.Actor.isRequired,
    size: PropTypes.number,
    default: PropTypes.string,
    title: PropTypes.string,
    gravatar: PropTypes.bool,
  };

  render() {
    const {actor, ...props} = this.props;

    if (actor.type === 'user') {
      const user = actor.id ? MemberListStore.getById(actor.id) : actor;
      return <UserAvatar user={user} hasTooltip {...props} />;
    }

    if (actor.type === 'team') {
      const team = TeamStore.getById(actor.id);
      return <TeamAvatar team={team} hasTooltip {...props} />;
    }

    Sentry.withScope(scope => {
      scope.setExtra('actor', actor);
      Sentry.captureException(new Error('Unknown avatar type'));
    });

    return null;
  }
}

export default ActorAvatar;

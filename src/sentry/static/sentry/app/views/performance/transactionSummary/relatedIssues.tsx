import React from 'react';
import {Location} from 'history';
import styled from '@emotion/styled';
import pick from 'lodash/pick';

import {t, tct} from 'sentry/locale';
import {DEFAULT_RELATIVE_PERIODS} from 'sentry/constants';
import {URL_PARAM} from 'sentry/constants/globalSelectionHeader';
import {SectionHeading} from 'sentry/components/charts/styles';
import Button from 'sentry/components/button';
import EmptyStateWarning from 'sentry/components/emptyStateWarning';
import {Panel, PanelBody} from 'sentry/components/panels';
import space from 'sentry/styles/space';
import {OrganizationSummary} from 'sentry/types';
import GroupList from 'sentry/components/issues/groupList';
import {stringifyQueryObject} from 'sentry/utils/tokenizeSearch';

type Props = {
  organization: OrganizationSummary;
  location: Location;
  transaction: string;
  statsPeriod?: string;
  start?: string;
  end?: string;
};

class RelatedIssues extends React.Component<Props> {
  getIssuesEndpoint() {
    const {transaction, organization, start, end, statsPeriod, location} = this.props;
    const queryParams = {
      start,
      end,
      statsPeriod,
      limit: 5,
      sort: 'new',
      ...pick(location.query, [...Object.values(URL_PARAM), 'cursor']),
    };
    return {
      path: `/organizations/${organization.slug}/issues/`,
      queryParams: {
        ...queryParams,
        query: stringifyQueryObject({
          query: [],
          is: ['unresolved'],
          transaction: [transaction],
        }),
      },
    };
  }

  renderEmptyMessage = () => {
    const {statsPeriod} = this.props;

    const selectedTimePeriod = statsPeriod && DEFAULT_RELATIVE_PERIODS[statsPeriod];
    const displayedPeriod = selectedTimePeriod
      ? selectedTimePeriod.toLowerCase()
      : t('given timeframe');

    return (
      <Panel>
        <PanelBody>
          <EmptyStateWarning small withIcon={false}>
            {tct('No new issues for this transaction for the [timePeriod].', {
              timePeriod: displayedPeriod,
            })}
          </EmptyStateWarning>
        </PanelBody>
      </Panel>
    );
  };

  render() {
    const {organization} = this.props;
    const {path, queryParams} = this.getIssuesEndpoint();
    const issueSearch = {
      pathname: `/organizations/${organization.slug}/issues/`,
      query: queryParams,
    };

    return (
      <React.Fragment>
        <ControlsWrapper>
          <SectionHeading>{t('Related Issues')}</SectionHeading>
          <Button size="small" to={issueSearch}>
            {t('Open in Issues')}
          </Button>
        </ControlsWrapper>

        <TableWrapper>
          <GroupList
            orgId={organization.slug}
            endpointPath={path}
            queryParams={queryParams}
            query=""
            canSelectGroups={false}
            renderEmptyMessage={this.renderEmptyMessage}
            withChart={false}
            withPagination={false}
          />
        </TableWrapper>
      </React.Fragment>
    );
  }
}

const ControlsWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${space(1)};
`;

const TableWrapper = styled('div')`
  margin-bottom: ${space(4)};
  ${Panel} {
    /* smaller space between table and pagination */
    margin-bottom: -${space(1)};
  }
`;

export default RelatedIssues;

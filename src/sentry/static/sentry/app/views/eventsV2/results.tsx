import React from 'react';
import styled from '@emotion/styled';
import * as Sentry from '@sentry/browser';
import * as ReactRouter from 'react-router';
import {Location} from 'history';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import {Organization, GlobalSelection} from 'sentry/types';
import {PageContent} from 'sentry/styles/organization';
import {Client} from 'sentry/api';
import {getParams} from 'sentry/components/organizations/globalSelectionHeader/getParams';
import {fetchTotalCount} from 'sentry/actionCreators/events';
import {loadOrganizationTags} from 'sentry/actionCreators/tags';
import GlobalSelectionHeader from 'sentry/components/organizations/globalSelectionHeader';
import LightWeightNoProjectMessage from 'sentry/components/lightWeightNoProjectMessage';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import space from 'sentry/styles/space';
import SearchBar from 'sentry/views/events/searchBar';
import {trackAnalyticsEvent} from 'sentry/utils/analytics';
import withApi from 'sentry/utils/withApi';
import withOrganization from 'sentry/utils/withOrganization';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import EventView, {isAPIPayloadSimilar} from 'sentry/utils/discover/eventView';
import {ContentBox, Main, Side} from 'sentry/utils/discover/styles';
import Alert from 'sentry/components/alert';

import {DEFAULT_EVENT_VIEW} from './data';
import Table from './table';
import Tags from './tags';
import ResultsHeader from './resultsHeader';
import ResultsChart from './resultsChart';
import {generateTitle} from './utils';

type Props = {
  api: Client;
  router: ReactRouter.InjectedRouter;
  location: Location;
  organization: Organization;
  selection: GlobalSelection;
};

type State = {
  eventView: EventView;
  error: string;
  totalValues: null | number;
};

class Results extends React.Component<Props, State> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State): State {
    const eventView = EventView.fromLocation(nextProps.location);
    return {...prevState, eventView};
  }

  state = {
    eventView: EventView.fromLocation(this.props.location),
    error: '',
    totalValues: null,
  };

  componentDidMount() {
    const {api, organization, selection} = this.props;
    loadOrganizationTags(api, organization.slug, selection);
    this.checkEventView();
    this.fetchTotalCount();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {api, location, organization, selection} = this.props;
    const {eventView} = this.state;
    if (
      !isEqual(prevProps.selection.projects, selection.projects) ||
      !isEqual(prevProps.selection.datetime, selection.datetime)
    ) {
      loadOrganizationTags(api, organization.slug, selection);
    }

    this.checkEventView();
    const currentQuery = eventView.getEventsAPIPayload(location);
    const prevQuery = prevState.eventView.getEventsAPIPayload(prevProps.location);
    if (!isAPIPayloadSimilar(currentQuery, prevQuery)) {
      this.fetchTotalCount();
    }
  }

  async fetchTotalCount() {
    const {api, organization, location} = this.props;
    const {eventView} = this.state;
    if (!eventView.isValid()) {
      return;
    }

    try {
      const totals = await fetchTotalCount(
        api,
        organization.slug,
        eventView.getEventsAPIPayload(location)
      );
      this.setState({totalValues: totals});
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  checkEventView() {
    const {eventView} = this.state;
    if (eventView.isValid()) {
      return;
    }
    // If the view is not valid, redirect to a known valid state.
    const {location, organization, selection} = this.props;
    const nextEventView = EventView.fromNewQueryWithLocation(
      DEFAULT_EVENT_VIEW,
      location
    );
    if (nextEventView.project.length === 0 && selection.projects) {
      nextEventView.project = selection.projects;
    }

    ReactRouter.browserHistory.replace(
      nextEventView.getResultsViewUrlTarget(organization.slug)
    );
  }

  handleSearch = (query: string) => {
    const {router, location} = this.props;

    const queryParams = getParams({
      ...(location.query || {}),
      query,
    });

    // do not propagate pagination when making a new search
    const searchQueryParams = omit(queryParams, 'cursor');

    router.push({
      pathname: location.pathname,
      query: searchQueryParams,
    });
  };

  handleYAxisChange = (value: string) => {
    const {router, location} = this.props;

    const newQuery = {
      ...location.query,
      yAxis: value,
    };

    router.push({
      pathname: location.pathname,
      query: newQuery,
    });

    trackAnalyticsEvent({
      eventKey: 'discover_v2.y_axis_change',
      eventName: "Discoverv2: Change chart's y axis",
      organization_id: parseInt(this.props.organization.id, 10),
      y_axis_value: value,
    });
  };

  handleDisplayChange = (value: string) => {
    const {router, location} = this.props;

    const newQuery = {
      ...location.query,
      display: value,
    };

    router.push({
      pathname: location.pathname,
      query: newQuery,
    });
  };

  getDocumentTitle(): string {
    const {eventView} = this.state;
    if (!eventView) {
      return '';
    }
    return generateTitle({eventView});
  }

  renderTagsTable = () => {
    const {organization, location} = this.props;
    const {eventView, totalValues} = this.state;

    // Move events-meta call out of Tags into this component
    // so that we can push it into the chart footer.
    return (
      <Tags
        totalValues={totalValues}
        eventView={eventView}
        organization={organization}
        location={location}
      />
    );
  };

  renderError = error => {
    if (!error) {
      return null;
    }
    return (
      <Alert type="error" icon="icon-circle-exclamation">
        {error}
      </Alert>
    );
  };

  setError = error => {
    this.setState({error});
  };

  render() {
    const {organization, location, router, api} = this.props;
    const {eventView, error, totalValues} = this.state;
    const query = location.query.query || '';
    const title = this.getDocumentTitle();

    return (
      <SentryDocumentTitle title={title} objSlug={organization.slug}>
        <StyledPageContent>
          <LightWeightNoProjectMessage organization={organization}>
            <ResultsHeader
              organization={organization}
              location={location}
              eventView={eventView}
            />
            <ContentBox>
              <Top>
                {this.renderError(error)}
                <StyledSearchBar
                  organization={organization}
                  projectIds={eventView.project}
                  query={query}
                  onSearch={this.handleSearch}
                />
                <ResultsChart
                  api={api}
                  router={router}
                  organization={organization}
                  eventView={eventView}
                  location={location}
                  onAxisChange={this.handleYAxisChange}
                  onDisplayChange={this.handleDisplayChange}
                  total={totalValues}
                />
              </Top>
              <Main>
                <Table
                  organization={organization}
                  eventView={eventView}
                  location={location}
                  title={title}
                  setError={this.setError}
                />
              </Main>
              <Side>{this.renderTagsTable()}</Side>
            </ContentBox>
          </LightWeightNoProjectMessage>
        </StyledPageContent>
      </SentryDocumentTitle>
    );
  }
}

// These styled components are used in getsentry to create a paywall page.
// Be careful changing their interfaces.

export const StyledPageContent = styled(PageContent)`
  padding: 0;
`;

export const StyledSearchBar = styled(SearchBar)`
  margin-bottom: ${space(2)};
`;

export const Top = styled('div')`
  grid-column: 1/3;
  flex-grow: 0;
`;

function ResultsContainer(props: Props) {
  /**
   * Block `<Results>` from mounting until GSH is ready since there are API
   * requests being performed on mount.
   *
   * Also, we skip loading last used projects if you have multiple projects feature as
   * you no longer need to enforce a project if it is empty. We assume an empty project is
   * the desired behavior because saved queries can contain a project filter.
   */
  return (
    <GlobalSelectionHeader
      skipLoadLastUsed={props.organization.features.includes('global-views')}
    >
      <Results {...props} />
    </GlobalSelectionHeader>
  );
}

export default withApi(withOrganization(withGlobalSelection(ResultsContainer)));

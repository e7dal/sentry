import React from 'react';
import * as ReactRouter from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';

import {Client} from 'sentry/api';
import {t} from 'sentry/locale';
import {OrganizationSummary} from 'sentry/types';
import EventView from 'sentry/utils/discover/eventView';
import ChartZoom from 'sentry/components/charts/chartZoom';
import LineChart from 'sentry/components/charts/lineChart';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {SectionHeading} from 'sentry/components/charts/styles';
import TransparentLoadingMask from 'sentry/components/charts/transparentLoadingMask';
import TransitionChart from 'sentry/components/charts/transitionChart';
import {getInterval} from 'sentry/components/charts/utils';
import {IconWarning} from 'sentry/icons';
import EventsRequest from 'sentry/views/events/utils/eventsRequest';
import {PERFORMANCE_TERMS} from 'sentry/views/performance/constants';
import {getUtcToLocalDateObject} from 'sentry/utils/dates';
import {
  formatAbbreviatedNumber,
  formatFloat,
  formatPercentage,
} from 'sentry/utils/formatters';
import {decodeScalar} from 'sentry/utils/queryString';
import theme from 'sentry/utils/theme';
import space from 'sentry/styles/space';
import withApi from 'sentry/utils/withApi';

type Props = ReactRouter.WithRouterProps & {
  api: Client;
  organization: OrganizationSummary;
  location: Location;
  eventView: EventView;
};

function SidebarCharts({api, eventView, organization, router}: Props) {
  const statsPeriod = eventView.statsPeriod;
  const start = eventView.start ? getUtcToLocalDateObject(eventView.start) : undefined;
  const end = eventView.end ? getUtcToLocalDateObject(eventView.end) : undefined;
  const utc = decodeScalar(router.location.query.utc);

  const colors = theme.charts.getColorPalette(3);
  const axisLineConfig = {
    scale: true,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    splitLine: {
      show: false,
    },
  };
  const chartOptions = {
    height: 580,
    grid: [
      {
        top: '40px',
        left: '10px',
        right: '10px',
        height: '120px',
      },
      {
        top: '230px',
        left: '10px',
        right: '10px',
        height: '150px',
      },
      {
        top: '450px',
        left: '10px',
        right: '10px',
        height: '120px',
      },
    ],
    axisPointer: {
      // Link each x-axis together.
      link: [{xAxisIndex: [0, 1, 2]}],
    },
    xAxes: Array.from(new Array(3)).map((_i, index) => ({
      gridIndex: index,
      type: 'time',
      show: false,
    })),
    yAxes: [
      {
        // apdex
        gridIndex: 0,
        axisLabel: {
          formatter: (value: number) => formatFloat(value, 2),
          color: theme.gray1,
        },
        ...axisLineConfig,
      },
      {
        // throughput
        gridIndex: 1,
        axisLabel: {
          formatter: formatAbbreviatedNumber,
          color: theme.gray1,
        },
        ...axisLineConfig,
      },
      {
        // error rate
        gridIndex: 2,
        axisLabel: {
          formatter: (value: number) => formatPercentage(value, 2),
          color: theme.gray1,
        },
        ...axisLineConfig,
      },
    ],
    utc,
    isGroupedByDate: true,
    showTimeInTooltip: true,
    colors: [colors[0], colors[1], colors[2]],
    tooltip: {
      truncate: 80,
      valueFormatter(value: number, seriesName: string) {
        if (seriesName.includes('apdex')) {
          return formatFloat(value, 2);
        }
        if (seriesName.includes('error_rate')) {
          return formatPercentage(value, 2);
        }
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value;
      },
    },
  };

  const datetimeSelection = {
    start: start || null,
    end: end || null,
    period: statsPeriod,
  };
  const project = eventView.project;
  const environment = eventView.environment;

  return (
    <RelativeBox>
      <ChartTitle top="0px" key="apdex">
        {t('Apdex')}
        <QuestionTooltip position="top" title={PERFORMANCE_TERMS.apdex} size="sm" />
      </ChartTitle>

      <ChartTitle top="190px" key="throughput">
        {t('Throughput')}
        <QuestionTooltip position="top" title={PERFORMANCE_TERMS.rpm} size="sm" />
      </ChartTitle>

      <ChartTitle top="410px" key="error-rate">
        {t('Error Rate')}
        <QuestionTooltip position="top" title={PERFORMANCE_TERMS.errorRate} size="sm" />
      </ChartTitle>

      <ChartZoom
        router={router}
        period={statsPeriod}
        projects={project}
        environments={environment}
        xAxisIndex={[0, 1, 2]}
      >
        {zoomRenderProps => (
          <EventsRequest
            api={api}
            organization={organization}
            period={statsPeriod}
            project={[...project]}
            environment={[...environment]}
            start={start}
            end={end}
            interval={getInterval(datetimeSelection, true)}
            showLoading={false}
            query={eventView.query}
            includePrevious={false}
            yAxis={['apdex(300)', 'rpm()', 'error_rate()']}
          >
            {({results, errored, loading, reloading}) => {
              if (errored) {
                return (
                  <ErrorPanel>
                    <IconWarning color={theme.gray2} size="lg" />
                  </ErrorPanel>
                );
              }
              const series = results
                ? results.map((values, i: number) => ({
                    ...values,
                    yAxisIndex: i,
                    xAxisIndex: i,
                  }))
                : [];

              return (
                <TransitionChart loading={loading} reloading={reloading} height="550px">
                  <TransparentLoadingMask visible={reloading} />
                  <LineChart {...zoomRenderProps} {...chartOptions} series={series} />
                </TransitionChart>
              );
            }}
          </EventsRequest>
        )}
      </ChartZoom>
    </RelativeBox>
  );
}

const RelativeBox = styled('div')`
  position: relative;
  margin-bottom: ${space(2)};
`;

const ChartTitle = styled(SectionHeading)<{top: string}>`
  background: ${p => p.theme.white};
  position: absolute;
  top: ${p => p.top};
  margin: 0;
  z-index: 1;
`;

export default withApi(ReactRouter.withRouter(SidebarCharts));

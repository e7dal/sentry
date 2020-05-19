import React from 'react';

import CrumbTable from 'sentry/components/events/interfaces/breadcrumbs/crumbTable';
import SummaryLine from 'sentry/components/events/interfaces/breadcrumbs/summaryLine';
import {getMeta} from 'sentry/components/events/meta/metaProxy';

import getBreadcrumbCustomRendererValue from './getBreadcrumbCustomRendererValue';
import {BreadcrumbTypeDefault, BreadcrumbTypeNavigation} from './types';

type Props = {
  breadcrumb: BreadcrumbTypeDefault | BreadcrumbTypeNavigation;
};

const DefaultRenderer = ({breadcrumb}: Props) => (
  <CrumbTable
    breadcrumb={breadcrumb}
    summary={
      <SummaryLine>
        {breadcrumb?.message && (
          <pre>
            <code>
              {getBreadcrumbCustomRendererValue({
                value: breadcrumb.message,
                meta: getMeta(breadcrumb, 'message'),
              })}
            </code>
          </pre>
        )}
      </SummaryLine>
    }
    kvData={breadcrumb.data}
  />
);

export default DefaultRenderer;

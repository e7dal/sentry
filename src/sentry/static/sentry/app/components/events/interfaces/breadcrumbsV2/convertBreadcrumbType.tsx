import {defined} from 'sentry/utils';

import {Breadcrumb, BreadcrumbType} from './types';

function convertBreadcrumbType(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.type === BreadcrumbType.EXCEPTION) {
    return {
      ...breadcrumb,
      type: BreadcrumbType.ERROR,
    };
  }
  // special case for 'ui.' and `sentry.` category breadcrumbs
  // TODO: find a better way to customize UI around non-schema data
  if (breadcrumb.type === BreadcrumbType.DEFAULT && defined(breadcrumb?.category)) {
    const [category, subcategory] = breadcrumb.category.split('.');
    if (category === 'ui') {
      return {
        ...breadcrumb,
        type: BreadcrumbType.UI,
      };
    }

    if (category === 'console') {
      return {
        ...breadcrumb,
        type: BreadcrumbType.DEBUG,
      };
    }

    if (category === 'navigation') {
      return {
        ...breadcrumb,
        type: BreadcrumbType.NAVIGATION,
      };
    }

    if (
      category === 'sentry' &&
      (subcategory === 'transaction' || subcategory === 'event')
    ) {
      return {
        ...breadcrumb,
        type: BreadcrumbType.ERROR,
      };
    }
  }

  return breadcrumb;
}

export default convertBreadcrumbType;

import React from 'react';
import styled from '@emotion/styled';

import {tct} from 'sentry/locale';
import {IconEllipsis} from 'sentry/icons';
import space from 'sentry/styles/space';

import {GridCellLeft, IconWrapper} from './styles';

type Props = {
  onClick: () => void;
  quantity: number;
};

const BreadcrumbCollapsed = ({quantity, onClick}: Props) => (
  <Wrapper data-test-id="breadcrumb-collapsed" onClick={onClick}>
    <IconWrapper>
      <IconEllipsis />
    </IconWrapper>
    {tct('Show [quantity] collapsed crumbs', {quantity})}
  </Wrapper>
);

export default BreadcrumbCollapsed;

const Wrapper = styled(GridCellLeft)`
  cursor: pointer;
  background: ${p => p.theme.whiteDark};
  font-size: ${p => p.theme.fontSizeMedium};
  grid-column-start: 1;
  grid-column-end: -1;
  display: grid;
  grid-gap: ${space(1.5)};
  grid-template-columns: max-content 1fr;
`;

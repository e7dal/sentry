import React from 'react';
import styled from '@emotion/styled';

import {t} from 'sentry/locale';
import ConfigStore from 'sentry/stores/configStore';
import ExternalLink from 'sentry/components/links/externalLink';
import Hook from 'sentry/components/hook';
import getDynamicText from 'sentry/utils/getDynamicText';
import space from 'sentry/styles/space';

const Footer = () => {
  const config = ConfigStore.getConfig();
  return (
    <footer>
      <div className="container">
        <div className="pull-right">
          <FooterLink className="hidden-xs" href="/api/">
            {t('API')}
          </FooterLink>
          <FooterLink href="/docs/">{t('Docs')}</FooterLink>
          <FooterLink className="hidden-xs" href="https://github.com/getsentry/sentry">
            {t('Contribute')}
          </FooterLink>
          {config.isOnPremise && (
            <FooterLink className="hidden-xs" href="/out/">
              {t('Migrate to SaaS')}
            </FooterLink>
          )}
        </div>
        {config.isOnPremise && (
          <div className="version pull-left">
            {'Sentry '}
            {getDynamicText({
              fixed: 'Acceptance Test',
              value: config.version.current,
            })}
            <Build>
              {getDynamicText({
                fixed: 'test',
                value: config.version.build.substring(0, 7),
              })}
            </Build>
          </div>
        )}
        <a href="/" tabIndex={-1} className="icon-sentry-logo" />
        <Hook name="footer" />
      </div>
    </footer>
  );
};

const FooterLink = styled(ExternalLink)`
  &.focus-visible {
    outline: none;
    box-shadow: ${p => p.theme.blue} 0 2px 0;
  }
`;

const Build = styled('span')`
  font-size: ${p => p.theme.fontSizeRelativeSmall};
  color: ${p => p.theme.gray1};
  font-weight: bold;
  margin-left: ${space(1)};
`;

export default Footer;

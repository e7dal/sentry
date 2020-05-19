import PropTypes from 'prop-types';
import React from 'react';

import {Organization, Project, Plugin} from 'sentry/types';
import {enablePlugin, disablePlugin} from 'sentry/actionCreators/plugins';
import InactivePlugins from 'sentry/components/inactivePlugins';
import PluginConfig from 'sentry/components/pluginConfig';
import {t} from 'sentry/locale';

import {Panel, PanelItem} from './panels';

type Props = {
  organization: Organization;
  project: Project;
  pluginList: Plugin[];
  onDisablePlugin?: (plugin: Plugin) => void;
  onEnablePlugin?: (plugin: Plugin) => void;
};

const PluginList = ({
  organization,
  project,
  pluginList,
  onDisablePlugin = () => {},
  onEnablePlugin = () => {},
}: Props) => {
  const handleEnablePlugin = (plugin: Plugin) => {
    enablePlugin({
      projectId: project.slug,
      orgId: organization.slug,
      pluginId: plugin.slug,
    });

    onEnablePlugin(plugin);
  };

  const handleDisablePlugin = (plugin: Plugin) => {
    disablePlugin({
      projectId: project.slug,
      orgId: organization.slug,
      pluginId: plugin.slug,
    });

    onDisablePlugin(plugin);
  };

  if (!pluginList.length) {
    return (
      <Panel>
        <PanelItem>
          {t("Oops! Looks like there aren't any available integrations installed.")}
        </PanelItem>
      </Panel>
    );
  }

  return (
    <div>
      {pluginList
        .filter(p => p.enabled)
        .map(data => (
          <PluginConfig
            data={data}
            organization={organization}
            project={project}
            key={data.id}
            onDisablePlugin={handleDisablePlugin}
          />
        ))}

      <InactivePlugins
        plugins={pluginList.filter(p => !p.enabled && !p.isHidden)}
        onEnablePlugin={handleEnablePlugin}
      />
    </div>
  );
};

PluginList.propTypes = {
  organization: PropTypes.object.isRequired,
  project: PropTypes.object.isRequired,
  pluginList: PropTypes.array.isRequired,
  onDisablePlugin: PropTypes.func,
  onEnablePlugin: PropTypes.func,
};

export default PluginList;

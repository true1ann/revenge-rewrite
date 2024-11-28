import { toasts } from '@revenge-mod/modules/common'
import { TableRowIcon, TableSwitchRow } from '@revenge-mod/modules/common/components'
import { registerPlugin } from '@revenge-mod/plugins/internals'
import { useObservable } from '@revenge-mod/storage'
import { sleep } from '@revenge-mod/utils/functions'

import { addTableRowsToAdvancedSectionInRevengePage } from '../settings/pages/Revenge'

import AssetBrowserSettingsPage from './pages/AssetBrowser'
import DebugPerformanceTimesSettingsPage from './pages/DebugPerformanceTimes'
import DeveloperSettingsPage from './pages/Developer'

import { DevToolsEvents, connectToDevTools } from './devtools'

import type { PluginDefinition } from '@revenge-mod/plugins'
import type { FunctionComponent } from 'react'

const plugin = registerPlugin<{
    settingsRowShown: boolean
    reactDevTools: {
        address: string
        autoConnect: boolean
    }
}>(
    {
        name: 'Developer Settings',
        author: 'The Revenge Team',
        description: 'Developer settings for Revenge',
        id: 'revenge.developer-settings',
        version: '1.0.0',
        icon: 'WrenchIcon',
        async afterAppRender(context) {
            const {
                storage,
                revenge: {
                    assets,
                    ui: { settings: sui },
                },
            } = context

            function wrapPluginContext(Component: FunctionComponent) {
                return () => (
                    <PluginContext.Provider value={context}>
                        <Component />
                    </PluginContext.Provider>
                )
            }

            DevToolsEvents.on('error', err =>
                toasts.open({
                    key: 'revenge.plugins.settings.react-devtools.error',
                    content: `Error while connecting to React DevTools:\n${err.message}`,
                }),
            )

            DevToolsEvents.on('connect', () =>
                toasts.open({
                    key: 'revenge.plugins.settings.react-devtools.connected',
                    content: 'Connected to React DevTools',
                }),
            )

            if (storage.reactDevTools.autoConnect && globalThis.__reactDevTools)
                connectToDevTools(storage.reactDevTools.address)

            // Wait for the section to be added by the Settings plugin
            await sleep(0)

            sui.addRowsToSection('Revenge', {
                RevengeDeveloper: {
                    type: 'route',
                    label: 'Developer',
                    icon: assets.getIndexByName('WrenchIcon'),
                    component: wrapPluginContext(DeveloperSettingsPage),
                    predicate: () => storage.settingsRowShown,
                },
            })

            sui.createRoute('RevengeDebugPerformanceTimes', {
                type: 'route',
                label: 'Debug Performance Times',
                component: DebugPerformanceTimesSettingsPage,
                icon: assets.getIndexByName('TimerIcon'),
            })

            sui.createRoute('RevengeAssetBrowser', {
                type: 'route',
                label: 'Asset Browser',
                component: AssetBrowserSettingsPage,
                icon: assets.getIndexByName('ImageIcon'),
            })

            addTableRowsToAdvancedSectionInRevengePage(() => {
                useObservable([storage])

                return (
                    <TableSwitchRow
                        label="Show Developer Options"
                        icon={<TableRowIcon source={assets.getIndexByName('WrenchIcon')} />}
                        value={storage.settingsRowShown}
                        onValueChange={(v: boolean) => (storage.settingsRowShown = v)}
                    />
                )
            })
        },
        initializeStorage: () => ({
            settingsRowShown: false,
            reactDevTools: {
                address: 'localhost:8097',
                autoConnect: false,
            },
        }),
    },
    true,
)

type PluginContextFor<T> = T extends PluginDefinition ? Parameters<NonNullable<T['afterAppRender']>>[0] : never

export const PluginContext = React.createContext<PluginContextFor<typeof plugin>>(null!)

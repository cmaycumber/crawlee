import type { BrowserLaunchContext } from "@crawlee/browser";
import { BrowserLauncher, Configuration } from "@crawlee/browser";
import { PlaywrightPlugin } from "@crawlee/browser-pool";
import ow from "ow";
import type { Browser, BrowserType, LaunchOptions } from "playwright";

export interface PlaywrightLaunchContext
  extends BrowserLaunchContext<LaunchOptions, BrowserType> {
  rebrowserParams?: {
    apiKey?: string;
    profileId?: string;
  };
}

export class PlaywrightLauncher extends BrowserLauncher<PlaywrightPlugin> {
  protected static override optionsShape = {
    ...BrowserLauncher.optionsShape,
    // Define the shape of rebrowserParams
    rebrowserParams: ow.optional.object.exactShape({
      apiKey: ow.optional.string,
      profileId: ow.optional.string,
    }),
  };

  protected context: PlaywrightLaunchContext;

  constructor(
    launchContext: PlaywrightLaunchContext = {},
    override readonly config = Configuration.getGlobalConfig()
  ) {
    const { launchOptions = {}, ...rest } = launchContext;

    // Validate the launch context
    ow(
      launchContext,
      "PlaywrightLauncherOptions",
      ow.object.partialShape(PlaywrightLauncher.optionsShape)
    );

    super(
      {
        ...rest,
        launchOptions: {
          ...launchOptions,
          executablePath: getDefaultExecutablePath(launchContext, config),
        },
      },
      config
    );

    this.Plugin = PlaywrightPlugin;
    this.context = launchContext;
  }

  override async launch(): Promise<Browser> {
    let browser: Browser | undefined;

    if (this.context.rebrowserParams) {
      browser = await this.launcher.connectOverCDP(
        `wss://ws.rebrowser.net/?${new URLSearchParams(this.context.rebrowserParams)}`
      );
    }

    if (!browser) {
      browser = await super.launch();
    }

    return browser;
  }
}

function getDefaultExecutablePath(
  launchContext: PlaywrightLaunchContext,
  config: Configuration
): string | undefined {
  const pathFromPlaywrightImage = config.get("defaultBrowserPath");
  const { launchOptions = {} } = launchContext;

  if (launchOptions.executablePath) {
    return launchOptions.executablePath;
  }

  if (launchContext.useChrome) {
    return undefined;
  }

  if (pathFromPlaywrightImage) {
    return pathFromPlaywrightImage;
  }

  return undefined;
}

export async function launchPlaywright(
  launchContext?: PlaywrightLaunchContext,
  config = Configuration.getGlobalConfig()
): Promise<Browser> {
  const playwrightLauncher = new PlaywrightLauncher(launchContext, config);
  return playwrightLauncher.launch();
}
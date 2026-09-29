import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// Cloud containers ship Chromium under /opt/pw-browsers; locally Remotion downloads its own.
const shell = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (existsSync(shell)) Config.setBrowserExecutable(shell);
// broadcast colour space so Instagram/phones show the brand red and cream as designed
Config.setColorSpace('bt709');

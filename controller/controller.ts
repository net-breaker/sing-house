import { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import * as contextMenu from "electron-context-menu";
import * as fs from "fs";
import * as os from "os";

export class Controller {
  private platform = os.platform();
  private window?: BrowserWindow;
  private windowConfig: BrowserWindowConstructorOptions = {
    width: 850,
    height: 600,
    minWidth: 850,
    minHeight: 600,
    // mac title menu
    titleBarStyle: "hiddenInset",
    transparent: this.platform === "darwin" ? true : false,
    autoHideMenuBar: this.platform === "darwin" ? false : true,
    frame: true,
    vibrancy: "sidebar",
    visualEffectState: "followWindow",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      spellcheck: false
    }
  };

  constructor() {
    this.setEnvironment();
  }

  startup() {
    if (this.window) {
      this.window.show();
      return;
    }

    this.window = new BrowserWindow(this.windowConfig);
    if (process.argv.indexOf("--port") > -1) {
      const portIndex = process.argv.indexOf("--port") + 1;
      const port = process.argv[portIndex];
      this.window.webContents.openDevTools({ mode: "bottom" });
      process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
      this.window.loadURL(`http://localhost:${port}`);
    } else {
      this.window.loadFile("./controller/index.html");
    }
    this.setContextMenu();
  }

  private setEnvironment() {
    let NODE_CONFIG_DIR = `${process.resourcesPath}/config`;

    // development
    const exsitOnWorkspace = fs.existsSync("./resources/config");
    if (exsitOnWorkspace) NODE_CONFIG_DIR = "./resources/config";

    process.env["NODE_CONFIG_DIR"] = NODE_CONFIG_DIR;
    console.log(`export NODE_CONFIG_DIR=${NODE_CONFIG_DIR}`);
  }

  private setContextMenu() {
    const getProfileName = (title: string): string => {
      return title.substring(0, title.indexOf("\n"));
    };
    const contextMenuConfig: contextMenu.Options = {
      showInspectElement: false,
      showSelectAll: false,
      showCopyImage: false,
      showSaveImageAs: false,
      showLearnSpelling: false,
      showLookUpSelection: false,
      showSearchWithGoogle: false,
      menu: (actions, params, browserWindow) => [],
      prepend: (defaultActions, parameters, browserWindow, event) => [
        {
          label: "edit",
          visible: parameters.titleText.endsWith("file") || parameters.titleText.endsWith("connection"),
          click: () => {
            let name = getProfileName(parameters.titleText);
            this.window!.webContents.send("profiles", "edit", name);
          }
        },
        {
          label: "coder",
          visible: parameters.titleText.endsWith("local file") || parameters.titleText.endsWith("remote file"),
          click: () => {
            let name = getProfileName(parameters.titleText);
            this.window!.webContents.send("profiles", "coder", name);
          }
        },
        {
          label: "sync",
          visible: parameters.titleText.endsWith("remote file"),
          click: () => {
            let name = getProfileName(parameters.titleText);
            this.window!.webContents.send("profiles", "sync", name);
          }
        },
        {
          label: "delete",
          visible: parameters.titleText.endsWith("file") || parameters.titleText.endsWith("connection"),
          click: () => {
            let name = getProfileName(parameters.titleText);
            this.window!.webContents.send("profiles", "delete", name);
          }
        }
      ]
    };
    contextMenu(contextMenuConfig);
  }
}

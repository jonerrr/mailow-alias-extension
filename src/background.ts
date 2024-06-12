import { Storage } from "@plasmohq/storage"
import { type Settings, generateAlias } from "~utils"

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason !== "install") return

  // set initial settings
  const storage = new Storage()

  await storage.set("settings", {
    host: "",
    apiKey: "",
    forwardAddress: "",
    aliasDomain: "",
    generationMethod: 1
  })
  await storage.set("initialSetup", true)

  // open options page
  chrome.runtime.openOptionsPage()
})

// this adds a menu item when you right click
chrome.contextMenus.create({
  title: "Generate Alias",
  id: "generateAlias",
  contexts: ["all"]
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "generateAlias") {
    const storage = new Storage()
    const settings: Settings = await storage.get("settings")

    const configured =
      settings.host &&
      settings.apiKey &&
      settings.forwardAddress &&
      settings.aliasDomain

    if (!configured) {
      // TODO error stuff (maybe create another message handler in content.ts for popups)
      console.log("not configured")
      return
    }

    const hostname = new URL(tab!.url!).hostname

    const alias = await generateAlias(settings as Required<Settings>, hostname)

    // once service workers support the clipboard api, we won't have to do this messaging stuff

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          message: "copyText",
          textToCopy: alias.address
        },
        function (response) {}
      )
    })
  }
})

export {}

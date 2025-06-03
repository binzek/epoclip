chrome.commands.onCommand.addListener((command) => {
  if (command === "open-epoclip-dialog") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, "open-epoclip-dialog");
    });
  }
});
function injectEpoclipButton() {
  // Only run on YouTube video pages
  if (!window.location.href.match(/^https:\/\/(www\.)?youtube\.com\/watch/))
    return;

  // Wait for the target container to appear
  const interval = setInterval(() => {
    const actions = document.querySelector(
      "#actions #top-level-buttons-computed"
    );

    if (actions && !document.getElementById("epoclip-btn")) {
      // Create button
      const button = document.createElement("button");
      button.id = "epoclip-btn";
      button.className = "epoclip-btn";
      button.title = "Save timestamp to Epoclip";

      actions.appendChild(button);

      const buttonIcon = document.createElement("img");
      buttonIcon.src = chrome.runtime.getURL("assets/icon.png");
      buttonIcon.alt = "Epoclip icon";
      buttonIcon.width = 24;
      buttonIcon.height = 24;
      buttonIcon.className = "epoclip-btn__icon";

      button.appendChild(buttonIcon);

      // Add click event
      button.addEventListener("click", () => {
        // Find the video element
        const video = document.querySelector("video");
        let wasPlaying = false;

        if (video) {
          wasPlaying = !video.paused;
          if (wasPlaying) video.pause();
        }

        // Remove any existing dialog
        const oldDialog = document.getElementById("epoclip-dialog");
        if (oldDialog) oldDialog.remove();

        // Create dialog overlay
        const overlay = document.createElement("div");
        overlay.id = "epoclip-dialog";
        overlay.className = "epoclip-dialog__overlay";

        document.body.appendChild(overlay);

        // Dialog box
        const dialog = document.createElement("div");
        dialog.className = "epoclip-dialog";

        overlay.appendChild(dialog);

        // Close button
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.className = "epoclip-dialog__close-btn";

        closeBtn.addEventListener("click", () => {
          overlay.remove();
          if (video && wasPlaying) video.play();
        });

        dialog.appendChild(closeBtn);

        // Title
        const title = document.createElement("h2");
        title.textContent = "Save video timestamp to Epoclip";
        title.className = "epoclip-dialog__title";

        dialog.appendChild(title);

        // Clip title input
        const label1 = document.createElement("label");
        label1.textContent = "Clip title";
        label1.className = "epoclip-dialog__label";

        dialog.appendChild(label1);

        const inputTitle = document.createElement("input");
        inputTitle.type = "text";
        inputTitle.placeholder = "My favorite moment";
        inputTitle.className = "epoclip-dialog__input";

        dialog.appendChild(inputTitle);

        // Timestamp input (disabled)
        const label2 = document.createElement("label");
        label2.textContent = "Timestamp (seconds)";
        label2.className = "epoclip-dialog__label";

        dialog.appendChild(label2);

        const inputTimestamp = document.createElement("input");
        inputTimestamp.type = "text";
        inputTimestamp.disabled = true;
        let timestamp = 0;
        if (video) timestamp = Math.round(video.currentTime);
        inputTimestamp.value = timestamp;
        inputTimestamp.className = "epoclip-dialog__input";

        dialog.appendChild(inputTimestamp);

        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save timestamp";
        saveBtn.className = "epoclip-dialog__save-btn";

        dialog.appendChild(saveBtn);

        // Save button click handler
        saveBtn.addEventListener("click", async () => {
          // Get title from input, fallback to default
          const clipTitle = inputTitle.value.trim() || "Untitled Epoclip";
          // Get timestamp from input (should be integer)
          const clipTimestamp = parseInt(inputTimestamp.value, 10) || 0;
          // Get original video title
          let videoTitle = "";
          const titleElem = document.querySelector(
            "h1.ytd-watch-metadata yt-formatted-string"
          );
          if (titleElem) videoTitle = titleElem.textContent.trim();
          // Get thumbnail url (mqdefault)
          let videoId = null;
          const urlMatch = window.location.href.match(/[?&]v=([^&#]+)/);
          if (urlMatch) videoId = urlMatch[1];
          let thumbnailUrl = videoId
            ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            : "";
          // Get current time
          const savedTime = Date.now();
          // Platform
          const platform = "YouTube";
          // New entry
          const newEntry = {
            title: clipTitle,
            timestamp: clipTimestamp,
            originalTitle: videoTitle,
            savedTime,
            thumbnailUrl,
            platform,
          };
          // Save to chrome.storage.local
          chrome.storage.local.get(["epoclip_timestamps"], (result) => {
            let arr = Array.isArray(result.epoclip_timestamps)
              ? result.epoclip_timestamps
              : [];
            arr.push(newEntry);
            chrome.storage.local.set({ epoclip_timestamps: arr }, () => {
              // Optionally, show a confirmation or close dialog
              overlay.remove();
              if (video && wasPlaying) video.play();
            });
          });
        });
      });
    }
    // Stop interval if button is injected
    if (document.getElementById("epoclip-btn")) clearInterval(interval);
  }, 1000);
}

// Listen for YouTube navigation events (SPAs)
function onYouTubeNavigation(cb) {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      cb();
    }
  }).observe(document, { subtree: true, childList: true });

  // Listen for YouTube's internal navigation event
  window.addEventListener("yt-navigate-finish", () => {
    cb();
  });
}

injectEpoclipButton();
onYouTubeNavigation(() => {
  injectEpoclipButton();
});

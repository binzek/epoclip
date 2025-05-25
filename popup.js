// popup.js
document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("epoclip-popup-content");
  content.innerHTML = "<div class='epoclip-loading'>Loading...</div>";

  chrome.storage.local.get(["epoclip_timestamps"], (result) => {
    const arr = Array.isArray(result.epoclip_timestamps)
      ? result.epoclip_timestamps
      : [];

    if (arr.length === 0) {
      content.innerHTML = `
        <div class="epoclip-empty">
          <div class="epoclip-empty-icon">🎬</div>
          <div class="epoclip-empty-title">No saved timestamps</div>
          <div class="epoclip-empty-desc">
            Visit <a href="https://youtube.com" target="_blank" class="epoclip-link">YouTube</a> and save your first timestamp!
          </div>
        </div>
      `;
      return;
    }

    content.innerHTML = `<div class="epoclip-list"></div>`;
    const list = content.querySelector(".epoclip-list");

    arr
      .slice()
      .reverse()
      .forEach((item, idx) => {
        const videoId = getVideoIdFromThumbnail(item.thumbnailUrl);
        const timedUrl = videoId
          ? `https://www.youtube.com/watch?v=${videoId}&t=${item.timestamp}s`
          : "#";

        const card = document.createElement("div");
        card.className = "epoclip-card";
        card.tabIndex = 0;
        card.innerHTML = `
          <div class="epoclip-card-thumb-wrap">
            <img class="epoclip-card-thumb" src="${
              item.thumbnailUrl
            }" alt="Thumbnail" />
          </div>
          <div class="epoclip-card-details">
            <div class="epoclip-card-titles">
              <div class="epoclip-card-title">${escapeHtml(item.title)}</div>
              <div class="epoclip-card-original">${escapeHtml(
                item.originalTitle
              )}</div>
            </div>
            <div class="epoclip-card-times">
              <span class="epoclip-card-timestamp"><span class="epoclip-svg-icon">${clockSVG()}</span>${formatTimestamp(
          item.timestamp
        )}</span>
              <span class="epoclip-card-saved"><span class="epoclip-svg-icon">${saveSVG()}</span>${formatSavedTime(
          item.savedTime
        )}</span>
            </div>
          </div>
          <div class="epoclip-card-actions">
            <button class="epoclip-btn-share" title="Copy link"><span class="epoclip-svg-icon">${linkSVG()}</span></button>
          </div>
          <button class="epoclip-btn-delete" title="Delete"><span class="epoclip-svg-icon">${deleteSVG()}</span></button>
        `;

        // Card click (except buttons)
        card.addEventListener("click", (e) => {
          if (
            e.target.closest(".epoclip-btn-share") ||
            e.target.closest(".epoclip-btn-delete")
          )
            return;
          window.open(timedUrl, "_blank");
        });

        card.addEventListener("keydown", (e) => {
          if (e.key === "Enter") window.open(timedUrl, "_blank");
        });

        // Share button
        card
          .querySelector(".epoclip-btn-share")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            const btn = card.querySelector(".epoclip-btn-share");
            navigator.clipboard.writeText(timedUrl).then(() => {
              // Replace icon with check
              const iconSpan = btn.querySelector(".epoclip-svg-icon");
              if (!iconSpan) return;
              iconSpan.innerHTML = checkSVG();
              btn.classList.add("epoclip-btn-check");
              setTimeout(() => {
                iconSpan.innerHTML = linkSVG();
                btn.classList.remove("epoclip-btn-check");
              }, 1000);
            });
          });

        // Delete button
        card
          .querySelector(".epoclip-btn-delete")
          .addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("Delete this timestamp?")) {
              arr.splice(arr.length - 1 - idx, 1);
              chrome.storage.local.set({ epoclip_timestamps: arr }, () => {
                card.remove();
                if (arr.length === 0) location.reload();
              });
            }
          });

        list.appendChild(card);
      });
  });
});

function formatTimestamp(sec) {
  sec = Number(sec) || 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatSavedTime(ms) {
  try {
    const d = new Date(ms);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function getVideoIdFromThumbnail(url) {
  const m = url.match(/\/vi\/([^/]+)\//);
  return m ? m[1] : null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clockSVG() {
  return `<svg width="20" height="20" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6L12 12L18 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

function saveSVG() {
  return `<svg width="20" height="20" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 19V5C3 3.89543 3.89543 3 5 3H16.1716C16.702 3 17.2107 3.21071 17.5858 3.58579L20.4142 6.41421C20.7893 6.78929 21 7.29799 21 7.82843V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19Z" stroke="currentColor" stroke-width="1.5"></path><path d="M8.6 9H15.4C15.7314 9 16 8.73137 16 8.4V3.6C16 3.26863 15.7314 3 15.4 3H8.6C8.26863 3 8 3.26863 8 3.6V8.4C8 8.73137 8.26863 9 8.6 9Z" stroke="currentColor" stroke-width="1.5"></path><path d="M6 13.6V21H18V13.6C18 13.2686 17.7314 13 17.4 13H6.6C6.26863 13 6 13.2686 6 13.6Z" stroke="currentColor" stroke-width="1.5"></path></svg>`;
}

function linkSVG() {
  return `<svg width="20" height="20" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 11.9976C14 9.5059 11.683 7 8.85714 7C8.52241 7 7.41904 7.00001 7.14286 7.00001C4.30254 7.00001 2 9.23752 2 11.9976C2 14.376 3.70973 16.3664 6 16.8714C6.36756 16.9525 6.75006 16.9952 7.14286 16.9952" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M10 11.9976C10 14.4893 12.317 16.9952 15.1429 16.9952C15.4776 16.9952 16.581 16.9952 16.8571 16.9952C19.6975 16.9952 22 14.7577 22 11.9976C22 9.6192 20.2903 7.62884 18 7.12383C17.6324 7.04278 17.2499 6.99999 16.8571 6.99999" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

function deleteSVG() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 9L18.005 20.3463C17.8369 21.3026 17.0062 22 16.0353 22H7.96474C6.99379 22 6.1631 21.3026 5.99496 20.3463L4 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M21 6L15.375 6M3 6L8.625 6M8.625 6V4C8.625 2.89543 9.52043 2 10.625 2H13.375C14.4796 2 15.375 2.89543 15.375 4V6M8.625 6L15.375 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

function checkSVG() {
  return `<svg width="20" height="20" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

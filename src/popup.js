let clipiaKey = document.getElementById('clipiaKey');
const form = document.getElementById("form");

form.addEventListener("submit", e => {
    e.preventDefault();
    chrome.storage.sync.set({clipiaKey: clipiaKey.value});
    chrome.tabs.getSelected(null, tab => {
        chrome.tabs.executeScript(tab.id, { code: "window.location.reload()" });
    })
})
chrome.storage.sync.get(["clipiaKey"], item => {
    clipiaKey.value = item.clipiaKey || "";
})
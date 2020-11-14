let clipiaKey = document.getElementById('clipiaKey');
chrome.storage.sync.get(["clipiaKey"], item => {
    clipiaKey.value = item.clipiaKey;
})
clipiaKey.onchange = function(e) {
    chrome.storage.sync.set({clipiaKey: e.target.value});
};
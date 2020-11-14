chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const baseUrl = "https://clipia.ca/api/v1/media"
  const uploadUrl = `${baseUrl}/upload`;
  const existsUrl = `${baseUrl}/exists`;
  const formData = new FormData();

  chrome.storage.sync.get(["clipiaKey"], async (item) => {
    try {
      const existResponse = await fetch(existsUrl, {
        method: "POST",
        body: JSON.stringify({
          capture_ids: [request.id]
        }),
        headers: {
          Authorization: `Bearer ${item.clipiaKey}`,
          "Content-Type": "application/json"
        }
      });
      const existsJson = await existResponse.json();
      if(existsJson.capture_ids.length === 0) {
        sendResponse({ errors: "Already exists" });
        return;
      }
      
      const mediumResponse = await fetch(request.url, {
        credentials: "same-origin",
        redirect: "follow",
        body: null,
        method: "GET"
      })
  
      const mediumBlob = await mediumResponse.blob()
      let filename = request.isImage ? `${request.game}.webp` : `${request.game}.webm`;
      formData.append("file", mediumBlob, filename);
      formData.append("capture_id", request.id);
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${item.clipiaKey}`,
        },
      });
      const json = await uploadResponse.json();
      sendResponse(json);
    } catch(e) {
      sendResponse({ errors: "Not Authorized" })
    }
    
  });

  return true;
});
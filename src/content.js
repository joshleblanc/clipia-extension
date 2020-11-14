import MediaContainer from './components/media_container.svelte';


let captures = {};

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

const callback = function (mutationsList, observer) {
    mutationsList.forEach(mutation => {
        if (mutation.type === 'childList') {
            const containerNode = Array.from(mutation.addedNodes).find(node => {
                return node && node.querySelector && node.querySelector(`[data-capture-id]`)
            })
            if (containerNode) {
                const row = containerNode.querySelector('.google-material-icons').parentElement.parentElement.parentElement;
                const videoNode = containerNode.querySelector(`[data-capture-id]`);
                const buttons = row.children[1];
                const placeholder = document.createElement('div');
                buttons.prepend(placeholder);
                new MediaContainer({
                    target: placeholder,
                    props: captures[videoNode.dataset.captureId]
                });
            }
        }
    })
};

const observer = new MutationObserver(callback);
observer.observe(document, config);

document.addEventListener('update-captures', e => {
    captures = e.detail;
})

const inject = () => {

    const rpcQueryId = "CmnEcf"; // Took this from https://github.com/refi64/stratos/blob/main/lib/inject/captures_interceptor.dart#L17

    // https://github.com/refi64/stratos/blob/main/lib/inject/stadia_rpc_parser.dart#L19
    function decodeRpc(data) {
        let i = 0;
        while (true) {
            const responseStart = data.indexOf('[', i);
            if (responseStart == -1) {
                break;
            }

            const responseEnd = data.indexOf('\n]\n', responseStart);
            if (responseEnd == -1) {
                return [];
            }

            // + 2 is to make sure the terminating ] is included.
            var response = JSON.parse(data.substring(responseStart, responseEnd + 2));
            if (response[0][1] === rpcQueryId) {
                return JSON.parse(response[0][2]);
            }

            i = responseEnd + 1;
        }
    }

    const oldSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body = null) {
        this.addEventListener('load', () => {
            const urlSearchParams = new URL(this.responseURL).searchParams;
            const idString = urlSearchParams.get('rpcids');
            if (idString && idString.includes(rpcQueryId)) {
                const data = decodeRpc(this.response);

                const captures = {};

                data[0].forEach(datum => {
                    const id = datum[1];
                    const game = datum[3];
                    const isImage = datum[8] === null;
                    const url = isImage ? datum[7][1] : datum[8][1];
                    captures[id] = { id, game, isImage, url };
                });

                const event = new CustomEvent("update-captures", { detail: captures });
                document.dispatchEvent(event);
            }
        });
        oldSend.apply(this, [body]);
    }
};

const script = document.createElement('script');
script.textContent = `(${inject.toString()})()`;
(document.head || document.documentElement).prepend(script);

import MediaContainer from './components/media_container.svelte';
import { when, observable } from 'mobx';

let captures = observable.map({});

// Options for the observer (which mutations to observe)
const config = { attributes: true, childList: true, subtree: true };

const callback = function (mutationsList, observer) {
    
    mutationsList.forEach(mutation => {
        if (mutation.type === 'childList') {
            const containerNode = Array.from(mutation.addedNodes).find(node => {
                return node && node.querySelector && node.querySelector(`[data-capture-id]`)
            })
            if (containerNode) {
                
                const icons = containerNode.querySelectorAll('.google-material-icons');
                const lastIcon = icons[icons.length - 1];
                const row = lastIcon.parentElement.parentElement.parentElement.parentElement.parentElement;
                const videoNode = containerNode.querySelector(`[data-capture-id]`);
                const buttons = row.children[2];
                
                const placeholder = document.createElement('div');
                buttons.prepend(placeholder);
                when(() => captures.has(videoNode.dataset.captureId), () => {
                    new MediaContainer({
                        target: placeholder,
                        props: captures.get(videoNode.dataset.captureId)
                    });
                })
            }
        }
    })
};

// This exists to set the `captures` variable above, because
// the code that generates is injected directly into the page and 
// can't set it itself
document.addEventListener('update-captures', e => {
    captures.replace(e.detail);
})

const observer = new MutationObserver(callback);
observer.observe(document, config);

const inject = () => {

    const rpcQueryId = "CmnEcf"; // Took this from https://github.com/refi64/stratos/blob/main/lib/inject/captures_interceptor.dart#L17

    // https://github.com/refi64/stratos/blob/main/lib/inject/stadia_rpc_parser.dart#L19
    function decodeRpc(data) {
        let i = 0;
        const lines = data.split("\n");
        const message = lines.filter(a => a.includes(rpcQueryId));
        const outer = JSON.parse(message);
        if (outer[0][1] === rpcQueryId) {
            return JSON.parse(outer[0][2]);
        } else {
            return [];
        }
    }

    const oldSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (body = null) {
        this.addEventListener('load', () => {
            const urlSearchParams = new URL(this.responseURL).searchParams;
            const idString = urlSearchParams.get('rpcids');

            if (idString && idString.includes(rpcQueryId)) {
                const data = decodeRpc(this.response);

                const detail = {};

                data[0].forEach(datum => {
                    const id = datum[1];
                    const game = datum[3];
                    const isImage = datum[8] === null;
                    const url = isImage ? datum[7][1] : datum[8][1];
                    detail[id] = { id, game, isImage, url };
                });
                const event = new CustomEvent("update-captures", { detail });
                document.dispatchEvent(event);
            }
        });
        oldSend.apply(this, [body]);
    }
};

const script = document.createElement('script');
script.textContent = `(${inject.toString()})()`;
(document.head || document.documentElement).prepend(script);

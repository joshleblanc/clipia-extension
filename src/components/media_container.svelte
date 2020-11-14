<script>
    import "notyf/notyf.min.css";
    import { Notyf } from "notyf";
    import MdFileUpload from "svelte-icons/md/MdFileUpload.svelte";
    import { Shadow } from "svelte-loading-spinners";
    import SvelteTooltip from "svelte-tooltip";

    export let game;
    export let id;
    export let isImage;
    export let url;

    let loading = false;

    const notyf = new Notyf({
        duration: 10000,
        position: {
            x: "center",
            y: "bottom",
        },
        dismissible: true
    });

    let tip;
    let clipiaKey;

    $: {
        if (clipiaKey) {
            tip = null;
        } else {
            tip = "Add your Clipia API key to upload!";
        }
    }

    chrome.storage.sync.get("clipiaKey", (item) => {
        clipiaKey = item.clipiaKey;
    });

    const handleClick = async () => {
        loading = true;
        chrome.runtime.sendMessage({ game, id, isImage, url }, function (
            response
        ) {
            if (response.errors === "Not Authorized") {
                notyf.error(
                    "You're not allowed to do this. Check your API key"
                );
            } else if (response.errors) {
                notyf.error("You've already uploaded this!");
            } else {
                const notification = notyf.success(
                    `Uploaded! Click here to view or edit`
                );
                notification.on("click", () => {
                    window.location.href = response.url;
                });
            }
            loading = false;
        });
    };
</script>

<style>
    .container {
        z-index: 1;
        display: flex;
        width: 100%;
        justify-content: flex-end;
    }
    .button {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
    }
    .button-container {
        display: flex;
        align-items: center;
        padding: 16px;
        margin: 8px;
        color: white;
        border-style: hidden;
        background-color: rgba(0, 0, 0, 0);
    }
    .button-container-enabled:hover {
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.06);
        border-radius: 50px;
    }
    .button-container-disabled:hover {
        cursor: no-drop;
        background-color: rgba(255, 255, 255, 0.06);
        border-radius: 50px;
    }
</style>

{#if id}
    <div class="container">
        <SvelteTooltip {tip}>
            <button
                disabled={!clipiaKey}
                class:button-container-enabled={clipiaKey}
                class:button-container-disabled={!clipiaKey}
                class="button-container"
                on:click|preventDefault|stopPropagation={handleClick}>
                <div class="button">
                    {#if loading}
                        <Shadow size="16" color="#fff" />
                    {:else}
                        <MdFileUpload />
                    {/if}
                </div>
                <div>Upload to Clipia</div>
            </button>
        </SvelteTooltip>
    </div>
{/if}

<script lang="ts">
    import { root, GUN_PEERS } from "./lib/gun";
    import {
        fallbackMetadata,
        readPhotoMetadata,
        type PhotoMetadata,
    } from "./lib/metadata";
    import { photos, type ReelPhoto } from "./lib/photos";
    import CommentPanel from "./modules/CommentPanel.svelte";
    import MobileCommentsSheet from "./modules/MobileCommentsSheet.svelte";
    import ReelActions from "./modules/ReelActions.svelte";
    import type { Comment } from "./modules/types";

    type ReelState = {
        likes: Record<string, boolean>;
        comments: Record<string, Comment>;
    };

    const emptyReelState: ReelState = {
        likes: {},
        comments: {},
    };

    const viewerId =
        localStorage.getItem("fazilet-viewer-id") ?? crypto.randomUUID();

    localStorage.setItem("fazilet-viewer-id", viewerId);

    let activeIndex = $state(0);
    let commentOpen = $state(false);
    let draft = $state("");
    let states = $state<Record<string, ReelState>>({});
    let metadata = $state<Record<string, PhotoMetadata>>({});

    const activePhoto = $derived(photos[activeIndex]);
    const activeMetadata = $derived(
        activePhoto
            ? (metadata[activePhoto.id] ?? fallbackMetadata(activePhoto))
            : undefined,
    );
    const activeState = $derived(
        activePhoto ? readState(activePhoto.id) : undefined,
    );
    const likeCount = $derived(
        activeState ? Object.keys(activeState.likes).length : 0,
    );
    const comments = $derived(
        activeState
            ? Object.values(activeState.comments).sort(
                  (a, b) => b.createdAt - a.createdAt,
              )
            : [],
    );
    const liked = $derived(
        activeState ? Boolean(activeState.likes[viewerId]) : false,
    );

    function readState(photoId: string) {
        return states[photoId] ?? emptyReelState;
    }

    function ensureState(photoId: string) {
        states[photoId] ??= { likes: {}, comments: {} };
        return states[photoId];
    }

    function reelNode(photo: ReelPhoto) {
        return root.get("reels").get(photo.id);
    }

    function syncPhoto(photo: ReelPhoto) {
        const node = reelNode(photo);

        node.get("likes")
            .map()
            .on((value, key) => {
                const state = ensureState(photo.id);

                if (value) {
                    state.likes[key] = true;
                } else {
                    delete state.likes[key];
                }
            });

        node.get("comments")
            .map()
            .on((value, key) => {
                if (!value || typeof value !== "object") return;

                const comment = value as Partial<Comment>;
                if (!comment.body || !comment.createdAt) return;

                ensureState(photo.id).comments[key] = {
                    id: key,
                    body: String(comment.body).slice(0, 280),
                    createdAt: Number(comment.createdAt),
                };
            });
    }

    $effect(() => {
        photos.forEach(syncPhoto);
    });

    $effect(() => {
        for (const photo of photos) {
            if (metadata[photo.id]) continue;

            metadata[photo.id] = fallbackMetadata(photo);
            readPhotoMetadata(photo).then((value) => {
                metadata[photo.id] = value;
            });
        }
    });

    function setActive(index: number) {
        activeIndex = Math.max(0, Math.min(index, photos.length - 1));
    }

    function handleWheel(event: WheelEvent) {
        if (Math.abs(event.deltaY) < 20) return;
        setActive(activeIndex + (event.deltaY > 0 ? 1 : -1));
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "ArrowDown") setActive(activeIndex + 1);
        if (event.key === "ArrowUp") setActive(activeIndex - 1);
        if (event.key === "Escape") commentOpen = false;
    }

    function toggleLike() {
        if (!activePhoto) return;

        reelNode(activePhoto)
            .get("likes")
            .get(viewerId)
            .put(liked ? null : true);
    }

    function submitComment() {
        const body = draft.trim();
        if (!activePhoto || !body) return;

        const comment: Comment = {
            id: crypto.randomUUID(),
            body: body.slice(0, 280),
            createdAt: Date.now(),
        };

        reelNode(activePhoto).get("comments").get(comment.id).put(comment);
        draft = "";
        commentOpen = true;
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<main
    class="grid h-dvh grid-cols-[1fr] overflow-hidden bg-black text-white lg:grid-cols-[minmax(0,1fr)_23rem]"
>
    <section class="relative h-dvh overflow-hidden" onwheel={handleWheel}>
        {#if photos.length === 0}
            <div
                class="flex h-full items-center justify-center px-6 text-center"
            >
                <div class="max-w-md">
                    <h1 class="text-3xl font-semibold tracking-tight">
                        Add photos to start
                    </h1>
                    <p class="mt-3 text-sm leading-6 text-zinc-400">
                        Put images in <code
                            class="rounded bg-zinc-900 px-1.5 py-1 text-zinc-200"
                            >src/lib/photos</code
                        >.
                    </p>
                </div>
            </div>
        {:else}
            <div
                class="mx-auto flex h-full w-full max-w-[34rem] snap-y snap-mandatory flex-col overflow-y-auto scroll-smooth"
            >
                {#each photos as photo, index (photo.id)}
                    <article
                        class="relative grid h-dvh shrink-0 snap-start place-items-center bg-zinc-950"
                        class:ring-1={index === activeIndex}
                        class:ring-rose-500={index === activeIndex}
                        onmouseenter={() => setActive(index)}
                    >
                        <img
                            class="h-full w-full object-cover"
                            src={photo.src}
                            alt={photo.name}
                            draggable="false"
                        />
                        <div
                            class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/35"
                        ></div>

                        <div class="absolute bottom-0 left-0 right-16 p-5">
                            <div class="text-sm font-semibold text-white/90">
                                @anne-hanım
                            </div>
                            <h2
                                class="mt-2 text-2xl font-bold capitalize tracking-tight"
                            >
                                {metadata[photo.id]?.displayName ?? photo.name}
                            </h2>
                            <p class="mt-2 text-sm text-zinc-200">
                                {metadata[photo.id]?.dateLabel ??
                                    "Reading metadata..."}
                            </p>
                        </div>

                        <ReelActions
                            {liked}
                            {likeCount}
                            commentCount={comments.length}
                            onToggleLike={toggleLike}
                            onOpenComments={() => (commentOpen = true)}
                        />
                    </article>
                {/each}
            </div>
        {/if}
    </section>

    <aside class="hidden border-l border-white/10 bg-zinc-950/95 lg:block">
        <div class="flex h-full flex-col">
            <header class="border-b border-white/10 p-5">
                <h1 class="text-xl font-semibold tracking-tight">
                    Fazilet Reels
                </h1>
                {#if activePhoto && activeMetadata}
                    <div class="mt-4 rounded-lg bg-white/[0.06] p-3">
                        <p class="text-sm font-medium capitalize text-zinc-100">
                            {activeMetadata.displayName}
                        </p>
                        <p class="mt-1 text-xs text-zinc-500">
                            {activeMetadata.dateLabel}
                        </p>
                    </div>
                {/if}
                <p class="mt-2 break-all text-xs text-zinc-500">
                    Gun peer: {GUN_PEERS[0]}
                </p>
            </header>

            <CommentPanel {comments} bind:draft onSubmit={submitComment} />
        </div>
    </aside>

    {#if commentOpen}
        <MobileCommentsSheet
            {comments}
            bind:draft
            onClose={() => (commentOpen = false)}
            onSubmit={submitComment}
        />
    {/if}
</main>

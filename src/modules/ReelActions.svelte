<script lang="ts">
  import { Heart, MessageCircle } from 'lucide-svelte';

  let {
    liked,
    likeCount,
    commentCount,
    onToggleLike,
    onOpenComments
  }: {
    liked: boolean;
    likeCount: number;
    commentCount: number;
    onToggleLike: () => void;
    onOpenComments: () => void;
  } = $props();
</script>

<div class="absolute bottom-8 right-3 flex w-12 flex-col items-center gap-5">
  <button
    class="grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-white hover:text-black"
    aria-label={liked ? 'Unlike photo' : 'Like photo'}
    onclick={onToggleLike}
  >
    <Heart class={liked ? 'text-rose-500' : ''} size={26} fill={liked ? 'currentColor' : 'none'} />
  </button>
  <span class="-mt-4 text-xs font-semibold">{likeCount}</span>

  <button
    class="grid size-12 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-white hover:text-black"
    aria-label="Open comments"
    onclick={onOpenComments}
  >
    <MessageCircle size={26} />
  </button>
  <span class="-mt-4 text-xs font-semibold">{commentCount}</span>
</div>

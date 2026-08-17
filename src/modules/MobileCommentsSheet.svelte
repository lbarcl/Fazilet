<script lang="ts">
  import { X } from 'lucide-svelte';
  import CommentPanel from './CommentPanel.svelte';
  import type { Comment } from './types';

  let {
    comments,
    draft = $bindable(),
    onClose,
    onSubmit
  }: {
    comments: Comment[];
    draft: string;
    onClose: () => void;
    onSubmit: () => void;
  } = $props();
</script>

<div class="fixed inset-0 z-20 bg-black/70 lg:hidden" role="presentation" onclick={onClose}></div>
<section class="fixed bottom-0 left-0 right-0 z-30 flex max-h-[76dvh] flex-col rounded-t-2xl border border-white/10 bg-zinc-950 shadow-2xl lg:hidden">
  <header class="flex items-center justify-between border-b border-white/10 px-5 py-4">
    <h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-300">Comments</h2>
    <button class="grid size-9 place-items-center rounded-full bg-white/10" aria-label="Close comments" onclick={onClose}>
      <X size={18} />
    </button>
  </header>

  <CommentPanel {comments} bind:draft {onSubmit} />
</section>

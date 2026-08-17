<script lang="ts">
  import { Send } from 'lucide-svelte';
  import type { Comment } from './types';

  let {
    comments,
    draft = $bindable(),
    onSubmit
  }: {
    comments: Comment[];
    draft: string;
    onSubmit: () => void;
  } = $props();
</script>

<div class="min-h-0 flex-1 overflow-y-auto p-5">
  <h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-400">Comments</h2>
  <div class="mt-4 space-y-4">
    {#each comments as comment (comment.id)}
      <p class="rounded-lg bg-white/[0.06] p-3 text-sm leading-6 text-zinc-100">{comment.body}</p>
    {:else}
      <p class="text-sm text-zinc-500">No comments yet.</p>
    {/each}
  </div>
</div>

<form
  class="border-t border-white/10 p-4"
  onsubmit={(event) => {
    event.preventDefault();
    onSubmit();
  }}
>
  <div class="flex gap-2">
    <input
      class="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-rose-500"
      maxlength="280"
      placeholder="Add a comment"
      bind:value={draft}
    />
    <button
      class="grid size-11 shrink-0 place-items-center rounded-full bg-rose-500 text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      disabled={!draft.trim()}
      aria-label="Post comment"
    >
      <Send size={18} />
    </button>
  </div>
</form>

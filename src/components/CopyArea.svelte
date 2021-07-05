<script>
	export let grid;
	export let placeholder;
	export let block;
</script>

<div class="copy-area">
{#each grid as row, i}
	{#each row as item, j}
		{#if item.name != "Empty"}
		<!-- Comments to keep formatting but get rid of whitespace -->
			{#if j == 0}<!--
		 -->{item.code}<!--
		 -->{:else if grid[i][j - 1] != grid[i][j]}<!--
		 -->{item.code}<!--
		 -->{/if}<!--
		 -->{block}
			{:else}
			{placeholder}
		{/if}
	{/each}
	<br/>
{/each}
</div>

<style>
	.copy-area {
		background-color: rgb(189, 189, 189);
		padding: 30px;
		width: 36rem;
		text-align: center;
	}
</style>
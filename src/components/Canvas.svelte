<script>
	import { color } from '../stores'

    export let grid;
    export let block;
    export let placeholder;

</script>

<div class="canvas">
    {#each grid as row, i}
    	{#each row as item, j}
    		<span style="color: {item.color};" title="{item.name}"
    		on:click="{() => item = $color}" class="pointer">
    			{#if item.name != "Empty"}
    				{block}
    			{:else}
    				{placeholder}
    			{/if}
    		</span>
    	{/each}
    	<br/>
    {/each}
</div>

<style>
	.pointer {
		cursor: pointer;
	}

    .canvas {
		background-color: rgb(196, 182, 163);
		padding: 30px;
		user-select: none;
	}
</style>
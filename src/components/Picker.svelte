<script>
	import { color } from '../stores'
	
    export let colors;
    export let block;
    export let placeholder;
</script>

<div class="color-picker">
    {#each colors as item}
    	<span style="color: {item.color};" title="{item.name}"
    	on:click="{() => color.set(item)}" class="pointer">
    		{#if item.name != "Empty"}
    			{block}
    		{:else}
    			{placeholder}
    		{/if}
    	</span>
    {/each}
</div>

<style>
	.color-picker {
		padding: 10px;
		margin-top: 10px;
		margin-bottom: 10px;
		background-color: rgb(233, 233, 233);
	}

    .pointer {
        cursor: pointer;
    }
</style>
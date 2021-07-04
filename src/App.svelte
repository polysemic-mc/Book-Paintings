<script>
	let colors = [
		{
			"color": "",
			"code": "",
			"name": "Empty"
		},
		{
			"color": "#000000",
			"code": "§0",
			"name": "Black"
		},
		{
			"color": "#0000AA",
			"code": "§1",
			"name": "Dark Blue"
		},
		{
			"color": "#00AA00",
			"code": "§2",
			"name": "Dark Green"
		},
		{
			"color": "#00AAAA",
			"code": "§3",
			"name": "Dark Aqua"
		},
		{
			"color": "#AA0000",
			"code": "§4",
			"name": "Dark Red"
		},
		{
			"color": "#AA00AA",
			"code": "§5",
			"name": "Dark Purple"
		},
		{
			"color": "#FFAA00",
			"code": "§6",
			"name": "Gold"
		},
		{
			"color": "#AAAAAA",
			"code": "§7",
			"name": "Gray"
		},
		{
			"color": "#555555",
			"code": "§8",
			"name": "Dark Gray"
		},	
		{
			"color": "#5555FF",
			"code": "§9",
			"name": "Blue"
		},
		{
			"color": "#55FF55",
			"code": "§a",
			"name": "Green"
		},
		{
			"color": "#55FFFF",
			"code": "§b",
			"name": "Aqua"
		},
		{
			"color": "#FF5555",
			"code": "§c",
			"name": "Red"
		},
		{
			"color": "#FF55FF",
			"code": "§d",
			"name": "Light Purple"
		},
		{
			"color": "#FFFF55",
			"code": "§e",
			"name": "Yellow"
		},
		{
			"color": "#FFFFFF",
			"code": "§f",
			"name": "White"
		}
	];
	let block = "█";
	let placeholder = "▓"
	let grid = [
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
		[colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]],
	];
	let color = colors[0];
</script>

<main>
		<div class="canvas center">
		{#each grid as row}
			{#each row as item}
				<span style="color: {item.color};" title="{item.name}"
				on:click="{() => item = color}" class="pointer">
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

		<div class="center color-picker">
			{#each colors as item}
				<span style="color: {item.color};" title="{item.name}"
				on:click="{() => color = item}" class="pointer">
					{#if item.name != "Empty"}
						{block}
					{:else}
						{placeholder}
					{/if}
				</span>
			{/each}
		</div>

		<div class="center copy">
		{#each grid as row, i}
			{#each row as item, j}
				{#if item.name != "Empty"}
				<!-- Cannot have whitespace here -->
					{#if j == 0}{item.code}{:else if grid[i][j - 1] != grid[i][j]}{item.code}{/if}{block}
				{:else}
					{placeholder}
				{/if}
			{/each}
			<br/>
		{/each}
		</div>
</main>

<style>
	.center {
		margin: 0 auto;
		width: fit-content;
	}

	.color-picker {
		padding: 10px;
		margin-top: 10px;
		margin-bottom: 10px;
		background-color: rgb(233, 233, 233);
	}

	.pointer {
		cursor: pointer;
	}

	.copy {
		background-color: rgb(189, 189, 189);
		padding: 30px;
		width: 36rem;
		text-align: center;
	}

	.canvas {
		background-color: rgb(196, 182, 163);
		padding: 30px;
	}
</style>
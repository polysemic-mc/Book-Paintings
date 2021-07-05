<script>
	import Canvas from './components/Canvas.svelte';
	import CopyArea from './components/CopyArea.svelte';
	import Picker from './components/Picker.svelte';
	import { color } from './stores'

	const colors = [
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
	const block = "█";
	const placeholder = "▓"
	
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

	color.set(colors[0]);
</script>

<main>
	<div class="center">
		<Canvas block={block} placeholder={placeholder} bind:grid={grid} />
	</div>

	<div class="center">
		<Picker block={block} placeholder={placeholder} colors={colors} />
	</div>

	<div class="center">
		<CopyArea block={block} placeholder={placeholder} bind:grid={grid} />
	</div>
</main>

<style>
	.center {
		margin: 0 auto;
		width: fit-content;
	}
</style>
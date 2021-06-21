<script lang="ts">

	import Chart from './components/Chart.svelte';
	import Input from './components/Input.svelte';
	import List from './components/List.svelte';

	let names = [];
	let name: string;
	let index = -1;

	function addName({ detail }: CustomEvent<string>): void {
		names = [ ...names, detail ];
	}

	function removeName({ detail }: CustomEvent<number>): void {
		names.splice(detail, 1);
		names = names;
	}

	$: name = names[index] || 'Click on the bottle!';

</script>

<main>
	<section>
		{#if names.length > 2}
			<Chart {names} bind:index={index} />
			<h1>{name}</h1>
		{:else}
			<h1>Add at least 3 names to proceed</h1>
		{/if}
	</section>
	<aside>
		<Input on:add={ addName } />
		<List {index} {names} on:remove={ removeName } />
	</aside>
</main>

<style lang="scss">

	@import './scss/global';

	main {
		display: flex;
		justify-content: space-around;
		align-items: center;
		min-height: 100vh;

		> section {
			width: 75vw;
			height: 50vh;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;

			> h1 {
				text-align: center;
			}
		}

		> aside {
			width: 25vw;
			padding: 0 15px;
		}

		@media (orientation: portrait) {
			& {
				flex-direction: column;

				> section {
					width: 90vw;
					height: 60vh;
				}

				> aside {
					width: 100%;
				}
			}
		}
	}

</style>

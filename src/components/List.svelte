<script lang="ts">

  export let names: string[];
  export let index: number;

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ remove: number }>();

  function onClick(index: number): void {
    dispatch('remove', index);
  }

</script>

<ol>
  {#each names as name, i}
    <li class:active={ i === index }>
      <span>{name}</span>
      <button on:click={ () => onClick(i) }>X</button>
    </li>
  {/each}
</ol>

<style lang="scss">

  @import '../scss/colors';

  ol {
    padding: 0;
    font-size: 1.2rem;
  }

  li {
    clear: both;
    list-style-position: inside;
    padding: 7px 5px 10px 5px;
    border-radius: 5px;
    text-transform: capitalize;

    &.active {
      background: $green;
    }

    > button {
      float: right;
      cursor: pointer;
      background: $red;
      color: white;
      border: none;
      outline: none;
      border-radius: 5px;
      font-size: 1.2rem;
      padding: 0 10px;

      &:hover {
        background: $red-hovered;
      }

      &:active {
        background: $red-active;
      }
    }
  }

</style>

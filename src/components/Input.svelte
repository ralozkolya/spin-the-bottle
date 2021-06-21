<script lang="ts">

  export let placeholder = 'Add a new name...';

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ add: string }>();

  let name = '';

  function onAdd(): void {
    if (name) {
      name.split(',')
        .map(name => name.trim())
        .filter(name => name)
        .forEach(name => {
          dispatch('add', name);
        });
      name = '';
    }
  }

</script>

<div>
  <input type="text" { placeholder } bind:value={ name } on:change={ onAdd } />
  <button on:click={ onAdd }>+</button>
</div>
<div>
  <small>You can input multiple names separated with commas</small>
</div>

<style lang="scss">

  @import '../scss/colors';
  div {
    display: flex;
  }

  input {
    display: inline-block;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
    border-radius: 5px 0 0 5px;
    outline: none;
    border: none;
  }

  button {
    border-radius: 0 5px 5px 0;
    border: none;
    background: $green;
    outline: none;
    color: white;
    font-size: 1.5rem;
    padding: 0 15px;
    cursor: pointer;

    &:hover {
      background: $green-hovered;
    }

    &:active {
      background: $green-active;
    }
  }

  small {
    font-size: .75rem;
  }

</style>

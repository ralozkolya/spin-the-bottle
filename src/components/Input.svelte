<script lang="ts">

  export let placeholder = 'Add a new name...';

  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{ add: string }>();

  function onAdd({ currentTarget }): void {
    if (currentTarget.value) {
      dispatch('add', currentTarget.value);
      currentTarget.value = '';
    }
  }

</script>

<div>
  <input type="text" {placeholder} on:change={ onAdd } />
</div>

<style lang="scss">

  div {
    display: flex;
  }

  input {
    display: inline-block;
    box-sizing: border-box;
    width: 100%;
    padding: 10px;
    border-radius: 5px;
    outline: none;
    border: none;
  }

</style>

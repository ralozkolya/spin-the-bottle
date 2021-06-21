<script lang="ts">

  export let names: string[];
  export let index = 0;

  const CIRCLE = Math.PI * 2;

  let sectorAngle: number;
  let x: number;
  let y: number;
  let textAngle: number;
  let bottle: SVGImageElement;
  let timeout: number;
  let rotation = .1;
  let spinning = false;
  let textSize = .5;

  $: {
    sectorAngle = CIRCLE / names.length;
    x = -50 * Math.cos(sectorAngle) + 50;
    y = -50 * Math.sin(sectorAngle) + 50;
    textAngle = sectorAngle / 2;
    textSize = .5 - Math.floor(names.length / 10) / 10;
  }

  function spin(): void {
    clearTimeout(timeout);

    let newIndex: number;
    let newRotation: number;
    do {
      newRotation = rotation + CIRCLE * 3 + (Math.random() * CIRCLE);
      newIndex = getIndexFromAngle(newRotation);
    } while (index === newIndex);

    rotation = newRotation;
    timeout = setTimeout(() => spinning = false, 2050);
    spinning = true;
    update();
  }

  function getIndexFromAngle(angle: number): number {
    return Math.floor((((angle + CIRCLE * .25) % CIRCLE) / CIRCLE) * names.length);
  }

  function update(): void {
    if (spinning) {
      const transform = getComputedStyle(bottle).getPropertyValue('transform');
      const [ a, b ] = transform.substring(7, transform.length - 1).split(', ').map(parseFloat);
      const angle = Math.atan2(b, a);
      const normalized = angle < 0 ? angle + CIRCLE : angle;
      index = getIndexFromAngle(normalized);
      requestAnimationFrame(update);
    }
  }

</script>

<svg viewBox="-1 -1 102 102" on:click={ spin }>
  {#each names as name, i}
    <g style="transform: rotate({sectorAngle * i}rad)">
      <path d={`M 50 50 L 0 50 A 50 50 0 0 1 ${x} ${y} L 50 50`} />
      <text
        dominant-baseline="middle"
        style="transform: rotate({textAngle}rad); font-size: {textSize}rem;"
        x="2"
        y="50">
        {name}
      </text>
    </g>
  {/each}
  <image bind:this={bottle} style="transform: rotate({rotation}rad)" href="/bottle.png" x="42.5" y="5" />
</svg>

<style lang="scss">

	@import '../scss/mixins';

  svg {
    width: 100%;
    height: 100%;
    margin: 10px 0;
    user-select: none;
    cursor: pointer;

    > g {
      transform-origin: 50px 50px;

      > path {
        stroke-width: .3px;
        stroke: white;
      }

      > text {
        font-size: .5rem;
        text-anchor: start;
        transform-origin: 50px 50px;
        text-transform: capitalize;
        fill: white;
      }

      @include colored('fill', 'path');
    }

    > image {
      transform-origin: 50px 50px;
      transition: transform 2s ease-out;
      width: 15px;
      height: 90px;
    }
  }

</style>

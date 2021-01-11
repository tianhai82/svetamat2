<script>
import {
    createEventDispatcher
} from 'svelte';

const dispatch = createEventDispatcher();

export let label = '';
export let value = '';
export let group = '';
export let checked = false;
export let color = 'text-black';
export let disabled = false;

function handleChange(e) {
    dispatch('change', e.target.value);
}

function handleInput(e) {
    dispatch('input', e.target.value);
}
</script>

<label class="{color} flex items-center" class:cursor-not-allowed={disabled}
    class:cursor-pointer={!disabled} {disabled}>
    <input class="hidden" type="radio" name="{group}" {disabled} {value} on:change={(e)=>handleChange(e)}
    on:input={(e)=>handleInput(e)}>
    <div
        class="select-none rounded-full hover:bg-gray-300 w-8 h-8 flex items-center justify-center">
        <span class="material-icons">
            {#if checked }
            radio_button_checked
            {:else}
            radio_button_unchecked
            {/if}
        </span>
    </div>
    {#if label}
    <span>{label}</span>
    {:else}
    <slot></slot>
    {/if}
</label>

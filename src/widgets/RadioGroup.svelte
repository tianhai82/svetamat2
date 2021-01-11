<script>
import {
    createEventDispatcher
} from "svelte";

const dispatch = createEventDispatcher();

export let items = [];
export let value = "";
export let disabled = false;
export let color = "text-gray-700";
export let labelColor = "text-gray-700";
export let row = true;
export let column = false;
export let marginY = 'mb-1'
export let marginX = 'mr-6'
export let labelFieldName = undefined;
export let keywordFieldName = labelFieldName;

function handleChange(item) {
    value = item;
    dispatch('change', item);
}

function isIdentical(a, b) {
    if (keywordFieldName) {
        return a[keywordFieldName] === b[keywordFieldName];
    } else {
        return a === b;
    }
}
</script>

<div class="flex{column?' flex-col':''}">
    {#each items as item}
    <label class="{marginX} {marginY} flex items-center" class:cursor-not-allowed={disabled}
        class:cursor-pointer={!disabled} {disabled}>
        <input class="hidden" type="radio" name="group" {disabled} on:change={()=>handleChange(item)}
        on:input={()=>handleChange(item)}>
        <div
            class="select-none rounded-full hover:bg-gray-300 w-8 h-8 flex items-center justify-center">
            <span class="{color} material-icons">
                {#if isIdentical(item, value) }
                radio_button_checked
                {:else}
                radio_button_unchecked
                {/if}
            </span>
        </div>
        <span class="{labelColor}">{labelFieldName ? item[labelFieldName] : item}</span>
    </label>
    {/each}
</div>

<style>

</style>

<script>
import Checkbox from "../widgets/Checkbox.svelte";
import Radio from "../widgets/Radio.svelte";
import Input from "../widgets/Input.svelte";

let label1 = "Radio with label";
let value1 = "v1"
let color1 = "text-green-500";
let disabled1 = false;

let value2 = "v2"
let color2 = "text-red-700";
let disabled2 = false;

let selectedValue;

function radioChanged({
    detail
}) {
    selectedValue = detail
}

let showCode = false;
</script>

<h2 class="text-xl ml-4 font-semibold my-6">Radio</h2>

<div class="bg-gray-200 rounded my-4 px-4 table w-full">
    <h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3>
    <div class="table-row font-bold">
        <div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">label</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The label text of the radio button.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">''</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">value</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The value of the radio button.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">''</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">checked</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            Whether the radio button is selected.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            group
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The group this radio button belongs to.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">''</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">color</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The color of the radio button and the label. Accepts Tailwindcss text color
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">text-black</div>
    </div>
    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            Whether the radio button is disabled.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>
    </div>
</div>

<div class="bg-gray-200 rounded p-4 w-full">
    <h3 class="mx-2 mb-2 flex justify-between">
        <div class="text-lg font-bold">Demo</div>
        <Checkbox bind:checked={showCode}>Show Code</Checkbox>
    </h3>
    <div class="mt-2 mb-1 flex justify-evenly">
        <Radio
            on:change={radioChanged}
            group="g1"
            {selectedValue}
            label={label1}
            bind:value={value1}
            color={color1}
            disabled={disabled1} />
        <Radio
            on:change={radioChanged}
            group="g1"
            {selectedValue}
            bind:value={value2}
            color={color2}
            disabled={disabled2}>
            <i class="material-icons text-blue-700">facebook</i>
            <span class="text-orange-500">Radio button with slot</span>
        </Radio>
    </div>
    <div class="border border-gray-500 rounded px-3 py-4 w-full">
        <div class="w-full flex flex-row flex-wrap">
            <div class="px-4">
                <Checkbox label="disabled1" bind:checked={disabled1} />
            </div>
        </div>
        <div class="w-full flex flex-row flex-wrap">
            <div class="px-4 pb-2">
                <Input hideDetails outlined readonly label="group" value="g1" />
            </div>
            <div class="px-4 pb-2">
                <Input hideDetails outlined label="label1" bind:value={label1} />
            </div>
            <div class="px-4 pb-2">
                <Input hideDetails outlined label="color1" bind:value={color1} />
            </div>
        </div>

        <div class="w-full flex flex-row flex-wrap">
            <div class="px-4">
                <Checkbox label="disabled2" bind:checked={disabled2} />
            </div>
        </div>
        <div class="w-full flex flex-row flex-wrap">
            <div class="px-4 pb-2">
                <Input hideDetails outlined label="color2" bind:value={color2} />
            </div>
            <div class="px-4 pb-2">
                <Input hideDetails outlined label="Selected Value" bind:value={selectedValue} />
            </div>
        </div>
    </div>

</div>

<pre
    class:hidden={!showCode}
    class="my-2 bg-gray-200 rounded p-5 font-light">
    {`let selectedValue;
function radioChanged({
    detail
}) {
    selectedValue = detail
}

<div class="mt-2 mb-1 flex justify-evenly">
    <Radio
        on:change={radioChanged}
        group="g1"
        {selectedValue}
        label={label1}
        bind:value={value1}
        color={color1}
        disabled={disabled1} />
    <Radio
        on:change={radioChanged}
        group="g1"
        {selectedValue}
        bind:value={value2}
        color={color2}
        disabled={disabled2}>
        <i class="material-icons text-blue-700">facebook</i>
        <span class="text-orange-500">Radio button with slot</span>
    </Radio>
</div>`}
</pre>

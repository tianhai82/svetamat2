<script>
import RadioGroup from "../widgets/RadioGroup.svelte";
import Autocomplete from "../widgets/Autocomplete.svelte";
import Checkbox from "../widgets/Checkbox.svelte";
import Input from "../widgets/Input.svelte";

let items = [{
        countryCode: 'MYS',
        countryName: 'Malaysia',
    },
    {
        countryCode: 'JPN',
        countryName: 'Japan',
    },
    {
        countryCode: 'KOR',
        countryName: 'Korea',
    },
    {
        countryCode: "SGP",
        countryName: "Singapore",
    },
    {
        countryCode: "HKG",
        countryName: "Hong Kong",
    },
    {
        countryCode: "CHN",
        countryName: "China",
    },
];
let value = "";
let disabled = false;

let color = "text-red-700";
let labelColor = "text-blue-700";

let labelFieldName = "countryName";
let keywordFieldName = "countryCode";

let row = true;
let column = false;

let showCode = false;

let marginY = 'mb-3'
let marginX = 'mr-3'
</script>

<h2 class="text-xl ml-4 font-semibold my-6">Radio Group</h2>

<div class="bg-gray-200 rounded my-4 px-4 table w-full">
    <h3 class="text-lg font-bold ml-3 mt-5 mb-3">Properties</h3>
    <div class="table-row font-bold">
        <div class="table-cell py-3 px-3 border-b border-gray-400">Prop</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Description</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Type</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">Default</div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">items</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The list of items to choose from. Accepts an array of strings or objects.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">array</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">[]</div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">value</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The selected object/string.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            object/string
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">''</div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">disabled</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            Disables radio group.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">false</div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">color</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The color of the radio buttons. Accepts valid Tailwindcss text color class
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            text-gray-700
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">labelColor</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The color of the label. Accepts valid Tailwindcss text color class
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            text-gray-700
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">row</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            Displays radio buttons in row
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            true
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">column</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            Displays radio buttons in column
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">boolean</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            true
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">marginX</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The horizontal margin between radio buttons
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">mr-6</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            true
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">marginY</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            The vertical margin between radio buttons
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">mb-1</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            true
        </div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            labelFieldName
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            When an array of objects is passed to 'items', this prop specifies the
            field to display.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div>
    </div>

    <div class="table-row">
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            keywordFieldName
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">
            When an array of objects is passed to 'items', this prop specifies the
            field to determine which item is selected.
        </div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">string</div>
        <div class="table-cell py-3 px-3 border-b border-gray-400">undefined</div>
    </div>

</div>

<div class="bg-gray-200 rounded p-4 w-full">
    <h3 class="mx-2 mb-2 flex justify-between">
        <div class="text-lg font-bold">Demo</div>
        <Checkbox bind:checked={showCode}>Show Code</Checkbox>
    </h3>
    <div class="my-2">
        <RadioGroup
            {items}
            bind:value
            {color}
            {labelColor}
            {disabled}
            {labelFieldName}
            {keywordFieldName}
            {row}
            {column}
            {marginY}
            {marginX} />
    </div>
    <div class="border border-gray-500 rounded px-3 py-4 w-full">
        <div class="w-full flex flex-row flex-wrap">
            <div class="px-4">
                <Checkbox label="disabled" bind:checked={disabled} />
            </div>
            <div class="px-4">
                <Checkbox label="row" bind:checked={row} />
            </div>
            <div class="px-4">
                <Checkbox label="column" bind:checked={column} />
            </div>
        </div>
        <div class="w-full flex flex-row flex-wrap">

            <div class="px-4 pb-2">
                <Autocomplete
                    hideDetails
                    outlined
                    label="labelFieldName"
                    items={['countryCode','countryName']}
                    bind:value={labelFieldName} />
            </div>
            <div class="px-4 pb-2">
                <Autocomplete
                    hideDetails
                    outlined
                    label="keywordFieldName"
                    items={['countryCode','countryName']}
                    bind:value={keywordFieldName} />
            </div>

            <div class="px-4 pb-2">
                <Input
                    hideDetails
                    outlined
                    label="color"
                    bind:value={color} />
            </div>
            <div class="px-4 pb-2">
                <Input
                    hideDetails
                    outlined
                    label="labelColor"
                    bind:value={labelColor} />
            </div>

            <div class="px-4 pb-2">
                <Input
                    readonly
                    hideDetails
                    outlined
                    label="value[keywordFieldName]"
                    value={value[keywordFieldName]} />
            </div>

            <div class="px-4 pb-2">
                <Input
                    hideDetails
                    outlined
                    label="marginX"
                    bind:value={marginX} />
            </div>
            <div class="px-4 pb-2">
                <Input
                    hideDetails
                    outlined
                    label="marginY"
                    bind:value={marginY} />
            </div>

        </div>
    </div>
</div>

<pre
    class:hidden={!showCode}
    class="my-2 bg-gray-200 rounded p-5 font-light text-sm">
    {`
    let items = [
    {
    countryCode: 'MYS',
    countryName: 'Malaysia',
    },
    {
    countryCode: 'JPN',
    countryName: 'Japan',
    },
    {
    countryCode: 'KOR',
    countryName: 'Korea',
    },
    {
    countryCode: "SGP",
    countryName: "Singapore",
    },
    {
    countryCode: "HKG",
    countryName: "Hong Kong",
    },
    {
    countryCode: "CHN",
    countryName: "China",
    },
    ];
    function keywordsFunction(item) {
    if (item === undefined || item === null) {
    return "";
    }
    return (item.countryCode + "|" + item.countryName);
    }

    <Autocomplete
        {label}
        {items}
        {caseSensitive}
        bind:value
        {minCharactersToSearch}
        {noResultsText}
        {maxLen}
        {borderColor}
        {labelColor}
        {helperText}
        {helperTextColor}
        {outlined}
        {clearable}
        {disabled}
        {hideDetails}
        {labelFieldName}
        {keywordsFieldName}
        {keywordsFunction} />`}
</pre>

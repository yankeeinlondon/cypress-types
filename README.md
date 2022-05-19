# Cypress Types

Cypress provides the means to add commands to the Cypress command API but if you're using Typescript -- which of course you _should be_ -- then your commands are not typed [sad face].

This plugin addresses that shortcoming.

## Usage

In your `vite.config.ts` file you'll the following:

```ts
import CypressTypes from "cypress-types";

export default defineConfig({
    // ...
    plugins: [
        // ...
        CypressTypes()
    ]
})
```

With that added, your "commands" file will be analyzed at build time along as whenever a new command is updated and the type will then be made available immediately in a fully typed manner.

Before it will fully work ... one more piece of good news. Instead of doing something like the following:

```ts
Cypress.Commands.add('foobar', (foo: string) => {
  return `foo may be ${foo}, but bar is better!`;
})
```

Instead just export a functions like so:

```ts
export function foobar(foo: string) {
    return `foo may be ${foo}, but bar is better!`;
}
```

The Vite plugin will detect the commands file being updated and it's type will be computed and made available. Soon your increased productivity when dealing _foobar_ will be so good that people will pull you aside and ask you what you're doing and whether you can get "some of that stuff" for them. Feel free to tell them or you can simply awkwardly laugh and then excuse yourself from the room.

## Directories

By default Cypress sets up in the repo's `/cypress` directory and then there is a subdirectory `/cypress/support` where you're supposed to put your `index.ts` file full of goodies. This is where this plugin will look by default but because we sense you're the "rebel without a cause" type you might change the location (I sure do) and that's fine. Changing this directory is simply a matter of stating that in your `cypress.json` file:

```json
{
    "commandsFolder": "test/integration/support"
}
```

Now if you -- by chance -- don't have a `cypress.json` file at the root of your repo then:

1. you should probably get your head checked
2. you can alternatively set the COMMANDS_FOLDER environment variable to direct us to the right place

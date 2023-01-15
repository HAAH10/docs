import { lookupProject, lookupProjectDefinitions } from './notion'
import type { Definition, PageObjectProperty } from './notion'
import { stripCurlyQuotes, renderRichTexts } from './format'
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

import fs from 'fs'

function renderDefinition(definition: PageObjectProperty): string {
  if (definition.type != 'rich_text') {
    throw new Error('Expected definition')
  }
  return renderRichTexts(definition.rich_text)
}

function formatDefinitions(definitions: Definition[]) {
  // sort the array alphabetically by term
  definitions.sort((a, b) => a.term.localeCompare(b.term))

  const htmlArray = definitions.map(item => {
    // strip curlies
    const curliesStripped = stripCurlyQuotes(item.term);
    // remove all non-alphanumeric, non-space, and non-parentheses characters except for "$" and "-" from term
    const formattedTerm = curliesStripped.replace(/[^a-z0-9\s$-()-]/gi, '');
    // remove all non-alphanumeric and non-space characters, convert to lowercase, and replace spaces with hyphens
    // replace all attribute values surrounded by single quotes with double quotes
    const definition = renderDefinition(item.definition)
    return `### ${formattedTerm}\n${definition}\n\n`
  })

  // wrap the HTML strings in a <dl> element with a class of "hidden-glossary-list"
  return `<div class="hidden-glossary">\n\n${htmlArray.join('')}\n</div>\n`
}

async function main() {
  const governanceProject = await lookupProject('Governance docs')
  const definitions = await lookupProjectDefinitions(governanceProject)
  const definitionsHTML = formatDefinitions(definitions)
  fs.writeFileSync('../docs/partials/_glossary-partial.md', definitionsHTML)
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

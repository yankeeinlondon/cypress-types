import { join } from "path";
import { extractCommandTypes } from "../src/helpers";
import { expect, describe, it} from "vitest";

describe('Basic validation of plugin', () => {

  it('extractCommandTypes()', () => {
    const filename = join(process.cwd(), 'test/support/commands.ts')
    const commands = extractCommandTypes(filename)
    const names = commands.map(i => i.name)
    expect(names).toContain('foobar')
    expect(names).toContain('anonMultiplication')
    
    const foobar = commands.find(i => i.name === 'foobar')
    const anonMultiplication = commands.find(i => i.name === 'anonMultiplication')

    expect(foobar?.docs).toBeDefined()
    expect(anonMultiplication?.docs).toBeDefined()

    expect(foobar?.parameters).toHaveLength(1)
    expect(foobar?.parameters.map(i => i.name)).toContain('foo')
    expect(foobar?.parameters.map(i => i.type)).toContain('string')
    expect(foobar?.returnType).toContain('string')

    expect(anonMultiplication?.parameters).toHaveLength(2)
    expect(anonMultiplication?.parameters.map(i => i.type)).toContain('number')
    expect(anonMultiplication?.returnType).toContain('number')
  })


})
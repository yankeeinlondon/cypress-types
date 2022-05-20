import { Project, ProjectOptions, InterfaceDeclaration, JSDoc, SyntaxKind, ParameterDeclaration } from "ts-morph";
import {existsSync, readFileSync} from 'fs'
import { join } from "path";
import { Cy } from "./types";


export function detectDirectory(): string | undefined {
  if(process.env.COMMANDS_FOLDER)
    return process.env.COMMANDS_FOLDER
  const cypressConfig = join(process.cwd(), "cypress.json")
  if(existsSync(cypressConfig)) {
    const cfg = JSON.parse(readFileSync(cypressConfig, 'utf-8'))
    return cfg && cfg?.COMMANDS_FOLDER ? cfg.COMMANDS_FOLDER as string : undefined
  }
}

/**
 * Sets up a `ts-morph` AST project based on the output file. The intent
 * of the project is to generate an interface `Chainable<Subject>` and
 * in this first step we establish this basic structure.
 */
export function setupModuleAndInterface(file: string, options: ProjectOptions = {}) {
  /** Project for developing the new file */
  const p = new Project(options);
  /** the source file which will become the eventual output */
  const f = p.createSourceFile(file, {}, { overwrite: true });
  /** the `Cypress` module declaration */
  const m = f.addModule({
    name: "Cyprus",
    hasDeclareKeyword: true,
  });
  /** the `Chainable` interface with generic of `Subject` */
  const i = m.addInterface({
    name: "Chainable",
  });
  i.addTypeParameter("Subject");

  return { p, f, m, i };
}

export interface FunctionDefinition {
  file: string;
  name: string;
  docs: string;
  returnType: string;
  parameters: { name: string; type: string }[]
}

function processComments(comments: JSDoc[]) {
  return comments.map((d) => d
    .getText())
    .join("\n") + "\n"
}

function processParameters(parameters: ParameterDeclaration[]) {
  return parameters.map((p) => ({
    name: p.getName(),
    type: p.getType().getText(),
  }))
}

/**
 * extracts all functions from the command file and returns appropriate type info
 */
export function extractCommandTypes(file: string): FunctionDefinition[] {
  const p = new Project();
  const s = p.addSourceFileAtPath(file);
  const variables = s.getVariableStatements().filter(f => f.isExported()).map(
      v => {
        const found = v.getLastChild()
          ?.asKind(SyntaxKind.VariableDeclarationList)
          ?.getDeclarations();

        const candidate = found ? found[0] : undefined
        const arrow = candidate
          ? candidate.getChildrenOfKind(SyntaxKind.ArrowFunction)[0]
          : undefined

        return candidate && arrow
          ? {
            name: candidate.getName(),
            docs: processComments(v.getJsDocs()),
            parameters: processParameters(arrow.getParameters()),
            returnType: arrow.getReturnType().getText()
          } as  FunctionDefinition
          : undefined

      }).filter(i => i) as FunctionDefinition[]
  
  const fns = s.getFunctions().filter((f) => f.hasExportKeyword()).map((fn) => {
    return {
      file,
      name: fn.getName(),
      docs: processComments(fn.getJsDocs()),
      returnType: fn.getReturnType().getText(),
      parameters: processParameters(fn.getParameters()),
    } as FunctionDefinition;
  })

  return [...fns, ...variables];
}

/**
 * add all commands -- cross-file -- to the interface definition
 */
export function addCommandsToInterface(i: InterfaceDeclaration, files: string[]): FunctionDefinition[] {
  const fns = files.flatMap(f => extractCommandTypes(f));
  const symbols: FunctionDefinition[] = []
  fns.forEach((fn) => {
    symbols.push(fn)
    i.addMethod({
      name: fn.name || "unknown",
      leadingTrivia: fn.docs,
      returnType: fn.returnType,
      parameters: fn.parameters,
    });
  });

  return symbols
}

/**
 * Uses the passed-in Cypress commands to "add" each function to the runtime
 * environment.
 */
export async function addCommandsToRuntime(cy: Cy, fns: FunctionDefinition[]) {
  const files = Array.from(new Set<string>( fns.map(i => i.file)))
  files.forEach(f => {
    
  })
}
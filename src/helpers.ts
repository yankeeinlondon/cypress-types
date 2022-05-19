import { Project, ProjectOptions, InterfaceDeclaration, JSDoc, SyntaxKind, ParameterDeclaration } from "ts-morph";
import {existsSync, readFileSync} from 'fs'
import { join } from "path";


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
      name: fn.getName(),
      docs: processComments(fn.getJsDocs()),
      returnType: fn.getReturnType().getText(),
      parameters: processParameters(fn.getParameters()),
    } as FunctionDefinition;
  })

  return [...fns, ...variables];
}

/**
 * Receives the Interface `i` and a set of files to look in for exports in. This function
 * modifies the Interface definition _in place_ and therefore return is _void_.
 */
export function addCommandsToInterface(i: InterfaceDeclaration, files: string[]) {
  const fns = files.flatMap(f => extractCommandTypes(f));
  fns.forEach((fn) => {
    i.addMethod({
      name: fn.name || "unknown",
      leadingTrivia: fn.docs,
      returnType: fn.returnType,
      parameters: fn.parameters,
    });
  });
}



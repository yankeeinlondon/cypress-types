import {  Plugin } from "vite";
import { join } from "node:path"
import { addCommandsToInterface, addCommandsToRuntime, detectDirectory, setupModuleAndInterface } from "./helpers";
import {  Cy } from "./types";

/**
 * Vite Plugin which builds types file for your custom commands in Cypress
 */
export default function CypressCommands(cypress: Cy): Plugin {
  const directory = detectDirectory() || 'cypress/support'
  const fileGlob = `${join(process.cwd(), directory, "**/!(*.d).ts")}`
  const cypressFile = join(process.cwd(),  directory, "cypress.d.ts");

  return ({
    name: "cypress-types",
    enforce: "pre",
    // ensure types recomputed at build
    async buildStart() {
      const watchFiles = Object.keys(import.meta.glob(fileGlob))
      watchFiles.forEach(f => this.addWatchFile(f))
      
      try {
        const { p, i } = setupModuleAndInterface(cypressFile);
        addCommandsToInterface(i, watchFiles);
        await p.save();
      } catch(err) {
        this.warn(`- problems encountered while updating the Cypress commands [${watchFiles.join(', ')}]\n\n${err instanceof Error ? err.message : String(err)}`);
      }
    },

    // but also during "dev" mode when an appropriate file it touched
    async handleHotUpdate(ctx) {
      if(ctx.file.startsWith(directory) && ctx.file.includes('.ts') || !ctx.file.includes('.d.ts')) {
        const watchFiles = Object.keys(import.meta.glob(fileGlob))
        const { p, i } = setupModuleAndInterface(cypressFile);
        const fns = addCommandsToInterface(i, watchFiles);
        await addCommandsToRuntime(cypress, fns)
        await p.save();
      }
    }
  })
}



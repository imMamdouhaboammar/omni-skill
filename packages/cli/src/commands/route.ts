import pc from "picocolors";
import { routeRequest } from "../core/router";

export function routeCommand(prompt: string, options: { host?: string; json?: boolean; explain?: boolean }) {
  const result = routeRequest(prompt, options.host);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(pc.bold(pc.cyan("\n🧭 OmniSkill Dynamic Agentic Router")));
  console.log(pc.dim("━".repeat(60)));
  console.log(`${pc.bold("Intent:")}        ${pc.green(result.intent)} (confidence: ${Math.round(result.confidence * 100)}%)`);
  console.log(`${pc.bold("Current Host:")}  ${pc.yellow(result.detectedHost)}`);
  console.log(`${pc.bold("Target Hosts:")}  ${pc.magenta(result.targetHosts.join(", "))}`);
  if (result.skillName) {
    console.log(`${pc.bold("Skill Name:")}    ${pc.blue(result.skillName)}`);
  }
  console.log(pc.dim("━".repeat(60)));

  console.log(pc.bold("\n⚡ Dynamic Execution DAG Pipeline:"));
  result.dag.forEach((step, idx) => {
    const isLast = idx === result.dag.length - 1;
    const branch = isLast ? "└──" : "├──";
    console.log(`\n  ${pc.cyan(branch)} ${pc.bold(`[Step ${idx + 1}]`)} ${pc.bold(pc.white(step.skill))} ${pc.dim(`(${step.mode})`)}`);
    console.log(`      ${pc.dim("Purpose:")}    ${step.purpose}`);
    if (step.dependsOn && step.dependsOn.length > 0) {
      console.log(`      ${pc.dim("Depends On:")} ${step.dependsOn.join(", ")}`);
    }
    if (step.recommendedCommand) {
      console.log(`      ${pc.dim("Command:")}    ${pc.green(step.recommendedCommand)}`);
    }
    if (step.requiredReferences && step.requiredReferences.length > 0) {
      console.log(`      ${pc.dim("Refs:")}       ${step.requiredReferences.join(", ")}`);
    }
    if (step.recoveryStep) {
      console.log(`      ${pc.dim("On Failure:")} Loop back to -> ${pc.red(step.recoveryStep)}`);
    }
  });

  console.log(pc.bold("\n📚 Progressive Context Budget:"));
  console.log(`  ${pc.dim("Max Initial Tokens:")} ${result.contextBudget.maxTokens}`);
  console.log(`  ${pc.dim("Required Files:")}     ${result.contextBudget.recommendedFiles.join(", ")}`);

  if (options.explain) {
    console.log(pc.bold("\n💡 Router Rationale:"));
    console.log(`  ${pc.italic(result.explanation)}`);
  }
  console.log("\n");
}

import pc from "picocolors";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface EvalCommandOptions {
  candidate?: string;
  responses?: string;
  json?: boolean;
}

export interface EvalAssertion {
  pattern: string;
  required?: boolean;
}

export interface EvalCase {
  id: string;
  prompt?: string;
  assertions: EvalAssertion[];
}

export interface EvalCaseResult {
  id: string;
  status: "PASSED" | "FAILED" | "UNVERIFIED" | "ERROR";
  passed: boolean;
  message?: string;
  failingPattern?: string;
}

export interface EvalRunSummary {
  status: "PASS" | "FAIL" | "UNVERIFIED" | "INVALID_SUITE" | "ERROR";
  total: number;
  passed: number;
  failed: number;
  unverified: number;
  errors: number;
  pass_rate: number;
  results: EvalCaseResult[];
  error?: string;
}

export function evalSkillCommand(skillPathArg: string, options: EvalCommandOptions = {}): EvalRunSummary {
  const skillPath = resolve(process.cwd(), skillPathArg);
  const evalsPath = join(skillPath, "evals", "evals.json");

  if (!options.json) {
    console.log(pc.cyan(`\n🧪 Running BinEval harness on: ${pc.bold(skillPath)}\n`));
  }

  if (!existsSync(evalsPath)) {
    const errorMsg = `No evals/evals.json found at ${skillPath}. Cannot evaluate without an evaluation suite.`;
    const summary: EvalRunSummary = {
      status: "INVALID_SUITE",
      error: errorMsg,
      total: 0,
      passed: 0,
      failed: 0,
      unverified: 0,
      errors: 1,
      pass_rate: 0,
      results: []
    };
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(pc.red(`✖ ${errorMsg}`));
    }
    process.exit(1);
  }

  let rawCases: any;
  try {
    const raw = readFileSync(evalsPath, "utf-8");
    const data = JSON.parse(raw);
    rawCases = Array.isArray(data) ? data : data.evals;
  } catch (err: any) {
    const errorMsg = `Failed to parse evals.json: ${err.message}`;
    const summary: EvalRunSummary = {
      status: "INVALID_SUITE",
      error: errorMsg,
      total: 0,
      passed: 0,
      failed: 0,
      unverified: 0,
      errors: 1,
      pass_rate: 0,
      results: []
    };
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(pc.red(`✖ ${errorMsg}`));
    }
    process.exit(1);
  }

  if (!Array.isArray(rawCases) || rawCases.length === 0) {
    const errorMsg = "Evaluation suite contains no test cases (empty suite).";
    const summary: EvalRunSummary = {
      status: "INVALID_SUITE",
      error: errorMsg,
      total: 0,
      passed: 0,
      failed: 0,
      unverified: 0,
      errors: 1,
      pass_rate: 0,
      results: []
    };
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(pc.red(`✖ ${errorMsg}`));
    }
    process.exit(1);
  }

  let perCaseResponses: Record<string, string> | null = null;
  let singleCandidateResponse: string | null = null;

  if (options.responses) {
    try {
      const respPath = resolve(process.cwd(), options.responses);
      const respRaw = readFileSync(respPath, "utf-8");
      const respData = JSON.parse(respRaw);
      if (Array.isArray(respData)) {
        perCaseResponses = {};
        for (const item of respData) {
          if (item && typeof item === "object" && item.id) {
            perCaseResponses[item.id] = String(item.response ?? item.text ?? "");
          }
        }
      } else if (respData && typeof respData === "object") {
        perCaseResponses = respData;
      }
    } catch (err: any) {
      const errorMsg = `Failed to load responses file '${options.responses}': ${err.message}`;
      const summary: EvalRunSummary = {
        status: "ERROR",
        error: errorMsg,
        total: rawCases.length,
        passed: 0,
        failed: 0,
        unverified: rawCases.length,
        errors: 1,
        pass_rate: 0,
        results: []
      };
      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log(pc.red(`✖ ${errorMsg}`));
      }
      process.exit(1);
    }
  } else if (options.candidate !== undefined) {
    const candArg = options.candidate;
    const candPath = resolve(process.cwd(), candArg);
    if (existsSync(candPath)) {
      singleCandidateResponse = readFileSync(candPath, "utf-8");
    } else {
      singleCandidateResponse = candArg;
    }
  }

  const results: EvalCaseResult[] = [];

  for (let idx = 0; idx < rawCases.length; idx++) {
    const c = rawCases[idx];
    const cid = c?.id ?? `case-${idx + 1}`;

    let observedText: string | undefined;
    if (perCaseResponses !== null) {
      observedText = perCaseResponses[cid];
    } else if (singleCandidateResponse !== null) {
      observedText = singleCandidateResponse;
    }

    if (observedText === undefined) {
      results.push({
        id: cid,
        status: "UNVERIFIED",
        passed: false,
        message: "No observed candidate response provided for evaluation"
      });
      continue;
    }

    const assertions = c.assertions;
    if (!Array.isArray(assertions) || assertions.length === 0) {
      results.push({
        id: cid,
        status: "ERROR",
        passed: false,
        message: "Case has no assertions defined"
      });
      continue;
    }

    let casePassed = true;
    let failingPattern: string | undefined;
    let failureMessage: string | undefined;
    let errorOccurred = false;

    for (const a of assertions) {
      if (!a || typeof a !== "object" || typeof a.pattern !== "string") {
        errorOccurred = true;
        failureMessage = "Malformed assertion structure (missing pattern string)";
        break;
      }

      let regex: RegExp;
      try {
        regex = new RegExp(a.pattern, "i");
      } catch (err: any) {
        errorOccurred = true;
        failureMessage = `Invalid regular expression pattern '/${a.pattern}/': ${err.message}`;
        break;
      }

      const isMatch = regex.test(observedText);
      const isRequired = a.required !== false;

      if (isRequired && !isMatch) {
        casePassed = false;
        failingPattern = a.pattern;
        failureMessage = `Required pattern '/${a.pattern}/' did not match observed response`;
        break;
      }
      if (!isRequired && isMatch) {
        casePassed = false;
        failingPattern = a.pattern;
        failureMessage = `Forbidden pattern '/${a.pattern}/' unexpectedly matched observed response`;
        break;
      }
    }

    if (errorOccurred) {
      results.push({
        id: cid,
        status: "ERROR",
        passed: false,
        message: failureMessage
      });
    } else if (casePassed) {
      results.push({
        id: cid,
        status: "PASSED",
        passed: true
      });
    } else {
      results.push({
        id: cid,
        status: "FAILED",
        passed: false,
        failingPattern,
        message: failureMessage
      });
    }
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.status === "FAILED").length;
  const unverified = results.filter(r => r.status === "UNVERIFIED").length;
  const errors = results.filter(r => r.status === "ERROR").length;
  const pass_rate = total > 0 ? Number((passed / total).toFixed(4)) : 0;

  let overallStatus: EvalRunSummary["status"];
  if (unverified > 0) {
    overallStatus = "UNVERIFIED";
  } else if (errors > 0) {
    overallStatus = "ERROR";
  } else if (failed > 0) {
    overallStatus = "FAIL";
  } else if (passed === total && total > 0) {
    overallStatus = "PASS";
  } else {
    overallStatus = "FAIL";
  }

  const summary: EvalRunSummary = {
    status: overallStatus,
    total,
    passed,
    failed,
    unverified,
    errors,
    pass_rate,
    results
  };

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(`  Found ${total} evaluation cases.`);
    for (const r of results) {
      if (r.status === "PASSED") {
        console.log(pc.green(`  ✔ [CASE: ${r.id}] passed.`));
      } else if (r.status === "FAILED") {
        console.log(pc.red(`  ✖ [CASE: ${r.id}] failed: ${r.message}`));
      } else if (r.status === "UNVERIFIED") {
        console.log(pc.yellow(`  ? [CASE: ${r.id}] unverified: ${r.message}`));
      } else {
        console.log(pc.magenta(`  ⚠ [CASE: ${r.id}] error: ${r.message}`));
      }
    }

    console.log(`\n  Summary: ${passed}/${total} passed (${(pass_rate * 100).toFixed(1)}%). Failed: ${failed}, Unverified: ${unverified}, Errors: ${errors}`);
    if (overallStatus === "PASS") {
      console.log(pc.green(`\n✔ All ${total} evaluation cases verified with 100% pass rate.`));
    } else {
      console.log(pc.red(`\n✖ Evaluation suite did not pass (status: ${overallStatus}).`));
    }
  }

  if (overallStatus !== "PASS") {
    process.exit(1);
  }

  return summary;
}

import { readFile } from "fs/promises";
import { CopilotClient } from "@github/copilot-sdk";

/**
 * Simple Ralph loop — the minimal SDK equivalent of:
 *   while :; do cat PROMPT.md | copilot ; done
 *
 * Usage:
 *   npx tsx recipe/simple-ralph-loop.ts
 */

async function ralphLoop(promptFile: string, maxIterations: number = 50) {
  const client = new CopilotClient();
  await client.start();

  try {
    const prompt = await readFile(promptFile, "utf-8");

    for (let i = 1; i <= maxIterations; i++) {
      console.log(`\n=== Iteration ${i}/${maxIterations} ===`);

      // Fresh session each iteration — context isolation is the point
      const session = await client.createSession({ model: "gpt-5.1-codex-mini" });
      try {
        await session.sendAndWait({ prompt }, 600_000);
      } finally {
        await session.destroy();
      }

      console.log(`Iteration ${i} complete.`);
    }
  } finally {
    await client.stop();
  }
}

// Usage: point at your PROMPT.md
ralphLoop("PROMPT.md", 20);

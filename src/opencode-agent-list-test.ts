import {
  createOpencodeClient,
  type OpencodeClient,
} from '@opencode-ai/sdk/v2/client';

interface AgentListTestConfig {
  baseUrl: string;
  directory?: string;
  workspace?: string;
}

class OpenCodeAgentListTest {
  private readonly client: OpencodeClient;

  constructor(private readonly config: AgentListTestConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      responseStyle: 'fields',
    });
  }

  async run(): Promise<void> {
    console.log('[INFO] Listing available agents...');
    console.log(`  Directory : ${this.config.directory ?? '-'}`);
    console.log(`  Base URL  : ${this.config.baseUrl}`);

    const params: { location?: { directory?: string; workspace?: string } } = {};
    if (this.config.directory || this.config.workspace) {
      params.location = {};
      if (this.config.directory) params.location.directory = this.config.directory;
      if (this.config.workspace) params.location.workspace = this.config.workspace;
    }

    const result = await this.client.v2.agent.list(params);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to list agents: ${message}`);
    }

    const agents = result.data.data ?? [];
    console.log(`\n[SUCCESS] Found ${agents.length} agent(s)\n`);
    this.printAgents(agents);
  }

  private printAgents(agents: Array<unknown>): void {
    if (agents.length === 0) {
      console.log('No agents available');
      return;
    }

    agents.forEach((agent, index) => {
      if (agent && typeof agent === 'object') {
        const a = agent as Record<string, unknown>;
        const id = String(a.id ?? a.name ?? a.slug ?? index);
        const name = String(a.name ?? a.id ?? a.slug ?? '-');
        console.log(`[${index + 1}] ID   : ${id}`);
        console.log(`    Name : ${name}`);
        if (a.description) console.log(`    Desc : ${a.description}`);
      } else {
        console.log(`[${index + 1}] ${String(agent)}`);
      }
    });
    console.log();
  }
}

async function main(): Promise<void> {
  const config: AgentListTestConfig = {
    baseUrl: process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096',
  };
  if (process.env.OPENCODE_DIRECTORY) config.directory = process.env.OPENCODE_DIRECTORY;
  if (process.env.OPENCODE_WORKSPACE) config.workspace = process.env.OPENCODE_WORKSPACE;

  const test = new OpenCodeAgentListTest(config);
  await test.run();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

import {
  createOpencodeClient,
  type OpencodeClient,
  type TextPart,
  type ToolPart,
} from '@opencode-ai/sdk/v2/client';

interface ShellTestConfig {
  baseUrl: string;
  directory?: string;
  workspace?: string;
  sessionID?: string;
  providerID?: string;
  modelID?: string;
  agent: string;
  command: string;
}

class OpenCodeShellTest {
  private readonly client: OpencodeClient;

  constructor(private readonly config: ShellTestConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      responseStyle: 'fields',
    });
  }

  async run(): Promise<void> {
    console.log('[INFO] Shell command test');
    console.log(`  Command   : ${this.config.command}`);
    console.log(`  Directory : ${this.config.directory ?? '-'}`);
    console.log(`  Base URL  : ${this.config.baseUrl}`);

    const sessionID = this.config.sessionID ?? (await this.createSession()).id;
    console.log(`[INFO] Using session: ${sessionID}`);

    const response = await this.runShellCommand(sessionID);
    this.printResponse(response);
  }

  private async createSession(): Promise<{ id: string }> {
    console.log('[INFO] Creating new session...');

    const params: Record<string, unknown> = {};
    if (this.config.directory) params.directory = this.config.directory;
    if (this.config.workspace) params.workspace = this.config.workspace;
    if (this.config.agent) params.agent = this.config.agent;
    if (this.config.providerID && this.config.modelID) {
      params.model = {
        id: this.config.modelID,
        providerID: this.config.providerID,
      };
    }

    const result = await this.client.session.create(params as never);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to create session: ${message}`);
    }

    console.log(`[SUCCESS] Session created: ${result.data.id}`);
    return result.data;
  }

  private async runShellCommand(sessionID: string): Promise<{ info: { id: string }; parts: Array<{ type: string }> }> {
    console.log(`[INFO] Running shell command: "${this.config.command}"`);

    const params: Record<string, unknown> = {
      sessionID,
      command: this.config.command,
    };
    if (this.config.directory) params.directory = this.config.directory;
    if (this.config.workspace) params.workspace = this.config.workspace;
    if (this.config.agent) params.agent = this.config.agent;
    if (this.config.providerID && this.config.modelID) {
      params.model = {
        providerID: this.config.providerID,
        modelID: this.config.modelID,
      };
    }

    const result = await this.client.session.shell(params as never);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to run shell command: ${message}`);
    }

    return result.data;
  }

  private printResponse(response: { info: { id: string }; parts: Array<{ type: string }> }) {
    console.log(`[SUCCESS] Response message ID: ${response.info.id}`);

    if (response.parts.length === 0) {
      console.log('[INFO] No parts in response');
      return;
    }

    console.log('\n[Command Output / Assistant Response]');
    response.parts.forEach((part, index) => {
      if (part.type === 'text') {
        const textPart = part as TextPart;
        console.log(`\n[text #${index + 1}]`);
        console.log(textPart.text);
        return;
      }

      if (part.type === 'tool') {
        const toolPart = part as ToolPart;
        console.log(`\n[tool #${index + 1}] ${toolPart.tool} (${toolPart.state.status})`);
        if (toolPart.state.status === 'completed') {
          console.log(toolPart.state.output);
        } else if (toolPart.state.status === 'error') {
          console.log(`Error: ${toolPart.state.error}`);
        } else if (toolPart.state.status === 'running') {
          console.log(`Running: ${toolPart.state.title ?? ''}`);
        } else {
          console.log(`Input: ${JSON.stringify(toolPart.state.input)}`);
        }
        return;
      }

      console.log(`\n[${part.type} #${index + 1}]`);
      console.log(JSON.stringify(part, null, 2));
    });
  }
}

async function main(): Promise<void> {
  const config: ShellTestConfig = {
    baseUrl: process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096',
    command: process.env.OPENCODE_COMMAND ?? 'pwd',
    agent: process.env.OPENCODE_AGENT ?? 'build',
  };
  if (process.env.OPENCODE_DIRECTORY) config.directory = process.env.OPENCODE_DIRECTORY;
  if (process.env.OPENCODE_WORKSPACE) config.workspace = process.env.OPENCODE_WORKSPACE;
  if (process.env.OPENCODE_SESSION_ID) config.sessionID = process.env.OPENCODE_SESSION_ID;
  if (process.env.OPENCODE_PROVIDER_ID) config.providerID = process.env.OPENCODE_PROVIDER_ID;
  if (process.env.OPENCODE_MODEL_ID) config.modelID = process.env.OPENCODE_MODEL_ID;
  if (process.env.OPENCODE_AGENT) config.agent = process.env.OPENCODE_AGENT;

  const test = new OpenCodeShellTest(config);
  await test.run();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

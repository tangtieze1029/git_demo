/**
 * OpenCode Chat 集成测试 - 创建会话、获取会话详情、发送消息并打印 AI 响应
 */
import {
  createOpencodeClient,
  type OpencodeClient,
  type Session,
  type TextPart,
} from '@opencode-ai/sdk/v2/client';

interface ChatTestConfig {
  baseUrl: string;
  directory?: string;
  workspace?: string;
  sessionID?: string;
  providerID?: string;
  modelID?: string;
  agent?: string;
}

class OpenCodeChatTest {
  private readonly client: OpencodeClient;

  constructor(private readonly config: ChatTestConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      responseStyle: 'fields',
    });
  }

  async run(): Promise<void> {
    console.log('[INFO] Configuration:', JSON.stringify(this.config, null, 2));

    const sessionID = this.config.sessionID ?? (await this.createSession()).id;
    console.log(`[INFO] Using session: ${sessionID}`);

    const session = await this.getSessionDetails(sessionID);
    this.printSessionDetails(session);

    const response = await this.sendMessage(sessionID, '你好');
    this.printResponse(response);
  }

  private async createSession(): Promise<Session> {
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

  private async getSessionDetails(sessionID: string): Promise<Session> {
    console.log('[INFO] Reading session details...');

    const params: Record<string, unknown> = { sessionID };
    if (this.config.directory) params.directory = this.config.directory;
    if (this.config.workspace) params.workspace = this.config.workspace;

    const result = await this.client.session.get(params as never);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to get session details: ${message}`);
    }

    return result.data;
  }

  private printSessionDetails(session: Session): void {
    console.log('\n[Session Details]');
    console.log(`  ID        : ${session.id}`);
    console.log(`  Title     : ${session.title}`);
    console.log(`  Slug      : ${session.slug}`);
    console.log(`  Directory : ${session.directory}`);
    console.log(`  Project   : ${session.projectID}`);
    if (session.workspaceID) console.log(`  Workspace : ${session.workspaceID}`);
    if (session.agent) console.log(`  Agent     : ${session.agent}`);
    if (session.model) {
      console.log(`  Model     : ${session.model.providerID}/${session.model.id}`);
    }
    if (session.tokens) {
      console.log(`  Tokens    : input=${session.tokens.input} output=${session.tokens.output} reasoning=${session.tokens.reasoning}`);
    }
    console.log();
  }

  private async sendMessage(sessionID: string, text: string) {
    console.log(`[INFO] Sending message: "${text}"`);

    const params: Record<string, unknown> = {
      sessionID,
      parts: [
        {
          type: 'text',
          text,
        },
      ],
    };
    if (this.config.directory) params.directory = this.config.directory;
    if (this.config.workspace) params.workspace = this.config.workspace;
    if (this.config.providerID && this.config.modelID) {
      params.model = {
        providerID: this.config.providerID,
        modelID: this.config.modelID,
      };
    }

    const result = await this.client.session.prompt(params as never);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to send message: ${message}`);
    }

    return result.data;
  }

  private printResponse(response: { info: { id: string }; parts: Array<{ type: string }> }) {
    console.log(`[SUCCESS] Assistant message ID: ${response.info.id}`);

    const textParts = response.parts.filter((part): part is TextPart => part.type === 'text');
    if (textParts.length === 0) {
      console.log('[INFO] No text parts in response');
      return;
    }

    console.log('\n[Assistant Response]');
    textParts.forEach((part) => {
      console.log(part.text);
    });
  }
}

async function main(): Promise<void> {
  const config: ChatTestConfig = {
    baseUrl: process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096',
  };
  if (process.env.OPENCODE_DIRECTORY) config.directory = process.env.OPENCODE_DIRECTORY;
  if (process.env.OPENCODE_WORKSPACE) config.workspace = process.env.OPENCODE_WORKSPACE;
  if (process.env.OPENCODE_SESSION_ID) config.sessionID = process.env.OPENCODE_SESSION_ID;
  if (process.env.OPENCODE_PROVIDER_ID) config.providerID = process.env.OPENCODE_PROVIDER_ID;
  if (process.env.OPENCODE_MODEL_ID) config.modelID = process.env.OPENCODE_MODEL_ID;
  if (process.env.OPENCODE_AGENT) config.agent = process.env.OPENCODE_AGENT;

  //config.workspace = "/Users/tang/work/opencode_api"

  config.directory = "/Users/tang/work/ot-feature-a"

  const test = new OpenCodeChatTest(config);
  await test.run();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

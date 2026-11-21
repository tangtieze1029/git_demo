import {
  createOpencodeClient,
  type OpencodeClient,
} from '@opencode-ai/sdk/v2/client';

interface ConfigTestConfig {
  baseUrl: string;
  directory: string;
}

class OpenCodeConfigTest {
  private readonly client: OpencodeClient;

  constructor(private readonly config: ConfigTestConfig) {
    this.client = createOpencodeClient({
      baseUrl: config.baseUrl,
      responseStyle: 'fields',
    });
  }

  async run(): Promise<void> {
    console.log('[INFO] Querying configuration...');
    console.log(`  Directory : ${this.config.directory}`);
    console.log(`  Base URL  : ${this.config.baseUrl}`);

    const result = await this.client.config.get({
      directory: this.config.directory,
    } as never);

    if (result.error || !result.data) {
      const message = result.error instanceof Error ? result.error.message : JSON.stringify(result.error);
      throw new Error(`Failed to get configuration: ${message}`);
    }

    console.log('\n[SUCCESS] Configuration retrieved successfully\n');
    this.printConfig(result.data);
  }

  private printConfig(config: unknown): void {
    if (config === null || config === undefined) {
      console.log('Configuration is empty');
      return;
    }

    if (typeof config !== 'object') {
      console.log(String(config));
      return;
    }

    this.printObject(config as Record<string, unknown>, 0);
    console.log();
  }

  private printObject(obj: Record<string, unknown>, indent: number): void {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      console.log(`${this.indent(indent)}(empty object)`);
      return;
    }

    for (const [key, value] of entries) {
      this.printEntry(key, value, indent);
    }
  }

  private printEntry(key: string, value: unknown, indent: number): void {
    const prefix = this.indent(indent);
    const label = `${prefix}${key}`;

    if (value === null || value === undefined) {
      console.log(`${label}: -`);
      return;
    }

    if (typeof value === 'boolean') {
      console.log(`${label}: ${value ? 'true' : 'false'}`);
      return;
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      console.log(`${label}: ${value}`);
      return;
    }

    if (typeof value === 'string') {
      if (value.length === 0) {
        console.log(`${label}: ""`);
      } else {
        console.log(`${label}: ${value}`);
      }
      return;
    }

    if (value instanceof Date) {
      console.log(`${label}: ${value.toISOString()}`);
      return;
    }

    if (Array.isArray(value)) {
      console.log(`${label}:`);
      if (value.length === 0) {
        console.log(`${this.indent(indent + 1)}(empty array)`);
      } else {
        value.forEach((item, index) => {
          this.printEntry(`[${index}]`, item, indent + 1);
        });
      }
      return;
    }

    if (typeof value === 'object') {
      console.log(`${label}:`);
      this.printObject(value as Record<string, unknown>, indent + 1);
      return;
    }

    console.log(`${label}: ${String(value)}`);
  }

  private indent(level: number): string {
    return '  '.repeat(level);
  }
}

async function main(): Promise<void> {
  const config: ConfigTestConfig = {
    baseUrl: process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096',
    directory: process.env.OPENCODE_DIRECTORY ?? '/Users/tang/work/opencode_test',
  };

  const test = new OpenCodeConfigTest(config);
  await test.run();
}

main().catch((err) => {
  console.error('[ERROR]', err);
  process.exit(1);
});

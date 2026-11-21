import { createOpencodeClient } from '@opencode-ai/sdk/v2/client';

const baseUrl = process.env.OPENCODE_BASE_URL ?? 'http://localhost:4096';

console.log(`[INFO] Connecting to OpenCode API at: ${baseUrl}`);

const client = createOpencodeClient({
  baseUrl,
  responseStyle: 'fields',
});

async function main() {
  try {
    client.v2.model.list()
    const result = await client.v2.model.list();

    if (result.error) {
      console.error('[ERROR] Failed to list models:', result.error);
      process.exit(1);
    }

    const response = result.data;
    if (!response) {
      console.error('[ERROR] Empty response received');
      process.exit(1);
    }

    const models = response.data;
    console.log(`[SUCCESS] Retrieved ${models.length} models\n`);

    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Provider : ${model.providerID}`);
      console.log(`   Model ID : ${model.id}`);
      console.log(`   Family   : ${model.family ?? 'N/A'}`);
      console.log();
    });
  } catch (err) {
    console.error('[ERROR] Unexpected error:', err);
    process.exit(1);
  }
}

main();

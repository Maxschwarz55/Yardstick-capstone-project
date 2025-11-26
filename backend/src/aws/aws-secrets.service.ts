import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function getOpenAIKey(): Promise<string> {
  const secretName = "openai";       // match your AWS secret name
  const region = "us-east-2";        // your AWS region

  const client = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: secretName });

  const response = await client.send(command);

  if (!response.SecretString) {
    throw new Error("Secret is empty or not found");
  }

  const secretDict = JSON.parse(response.SecretString);

  // Adjust keys based on your secret structure
  const apiKey =
    secretDict.openai_api_key ||
    secretDict.api_key ||
    secretDict.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      `OpenAI API key not found in secret. Available keys: ${Object.keys(secretDict)}`
    );
  }

  return apiKey;
}

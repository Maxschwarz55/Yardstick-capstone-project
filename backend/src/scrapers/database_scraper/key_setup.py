import boto3
import json
from openai import OpenAI

def get_openai_key():
    """Retrieve OpenAI key from AWS Secrets Manager"""
    secret_name = "openai"
    region_name = "us-east-2"  # Your AWS region
    
    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        secret_string = get_secret_value_response['SecretString']

        # Parse the JSON string to get the actual API key
        secret_dict = json.loads(secret_string)

        # Extract the API key from the dictionary
        # Adjust the key name based on how your secret is structured in AWS
        # Common patterns: 'api_key', 'OPENAI_API_KEY', 'openai_api_key', etc.
        print(f"OPENAI JSON: {secret_dict}")
        api_key = secret_dict.get('openai_api_key') or secret_dict.get('api_key') or secret_dict.get('OPENAI_API_KEY')

        if not api_key:
            raise ValueError(f"Could not find API key in secret. Available keys: {list(secret_dict.keys())}")

        return api_key
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise
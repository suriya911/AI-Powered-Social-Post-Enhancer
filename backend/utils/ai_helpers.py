import boto3
import os
import json
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("REGION_NAME")
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

bedrock = boto3.client(
    service_name="bedrock-runtime",
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

rekognition = boto3.client(
    "rekognition",
    region_name=REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY
)

def extract_hashtags(text):
    """Extract and clean hashtags from text."""
    if not text:
        return []
    words = text.split()
    hashtags = []
    for word in words:
        if word.startswith('#'):
            clean_tag = word.lstrip('#').strip()
            if clean_tag and clean_tag not in [tag['text'] for tag in hashtags]:
                hashtags.append({
                    'text': clean_tag,
                    'selected': False  # default unselected, we'll fix selection below
                })
    return hashtags

def enhance_text_with_bedrock(user_text):
    if not user_text:
        return "No text provided.", []

    claude_messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": f"""Enhance this social media post with emojis and create 5 relevant hashtags.\nOnly return the enhanced post and the hashtags at the end (no numbering or explanation).\n\nInput: {user_text}"""
                }
            ]
        }
    ]

    models = [
        {
            "model_id": "anthropic.claude-3-haiku-20240307-v1:0",
            "payload": {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "temperature": 0.7,
                "messages": claude_messages
            }
        },
        {
            "model_id": "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "payload": {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "temperature": 0.7,
                "messages": claude_messages
            }
        },
        {
            "model_id": "meta.llama3-70b-instruct-v1:0",
            "payload": {
                "prompt": f"Enhance this social media post with emojis and add 5 trending hashtags at the end:\n\n{user_text}",
                "max_gen_len": 512,
                "temperature": 0.5,
                "top_p": 0.9
            }
        }
    ]

    default_hashtags = [
        {"text": "Motivation", "selected": False},
        {"text": "Success", "selected": False},
        {"text": "Growth", "selected": False},
        {"text": "Inspiration", "selected": False},
        {"text": "Goals", "selected": False}
    ]

    for model in models:
        try:
            print(f"[INFO] Trying model: {model['model_id']}")
            response = bedrock.invoke_model(
                modelId=model['model_id'],
                body=json.dumps(model['payload']),
                accept="application/json",
                contentType="application/json"
            )
            body = json.loads(response["body"].read().decode("utf-8"))

            if model['model_id'].startswith("meta.llama"):
                text = body.get("generation", body.get("outputs", [{}])[0].get("text", "")).strip()
            else:
                text_blocks = body.get("content", [])
                text = " ".join(block["text"] for block in text_blocks if block["type"] == "text").strip()

            if text:
                hashtags = extract_hashtags(text)

                # Apply the selection rule: first 3 selected, last 2 unselected (max 5)
                hashtags = hashtags[:5]
                for i, tag in enumerate(hashtags):
                    tag['selected'] = i < 3

                clean_text = ' '.join(word for word in text.split() if not word.startswith('#'))
                return clean_text.strip(), hashtags

        except Exception as e:
            print(f"[ERROR] Model {model['model_id']} failed → {str(e)}")
            continue

    return "⚠️ AI error: All models failed to respond.", default_hashtags

def extract_image_tags(bucket, filename):
    try:
        response = rekognition.detect_labels(
            Image={"S3Object": {"Bucket": bucket, "Name": filename}},
            MaxLabels=5
        )
        tags = [f"#{label['Name'].replace(' ', '')}" for label in response["Labels"]][:3]
        return [
            {"text": tag, "selected": i < 2} for i, tag in enumerate(tags)
        ]
    except Exception as e:
        print(f"[ERROR] Rekognition failed → {e}")
        return []

# if text:
#                 # Extract hashtags from the enhanced text
#                 hashtags = extract_hashtags(text)
                
#                 # If no hashtags found in the response, generate some based on the content
#                 if not hashtags:
#                     # Try to extract keywords from the text
#                     words = text.lower().split()
#                     keywords = [word for word in words if len(word) > 3 and not word.startswith(('#', '@', 'http'))]
#                     if keywords:
#                         # Use the most relevant words as hashtags
#                         unique_keywords = list(set(keywords))[:5]
#                         hashtags = [{"text": keyword.capitalize(), "selected": True} for keyword in unique_keywords]
#                     else:
#                         # Use default hashtags if no keywords found
#                         hashtags = default_hashtags

#                 # Ensure we have the text without hashtags for display
#                 clean_text = ' '.join(word for word in text.split() if not word.startswith('#'))
#                 return clean_text.strip(), hashtags[:5]  # Limit to 5 hashtags

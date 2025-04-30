from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import boto3
from werkzeug.utils import secure_filename
import uuid

from utils.ai_helpers import enhance_text_with_bedrock, extract_image_tags

load_dotenv()

app = Flask(__name__)
CORS(app)

s3 = boto3.client(
    "s3",
    region_name=os.getenv("REGION_NAME"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

@app.route('/enhance', methods=['POST'])
def enhance_post():
    text = request.form.get("text")
    file = request.files.get("image")

    image_tags = []
    image_url = ""

    if file:
        filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        s3.upload_fileobj(
            file,
            BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": file.content_type}
        )
        image_url = s3.generate_presigned_url(
            ClientMethod='get_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': filename
            },
            ExpiresIn=1200
        )

        image_tags = extract_image_tags(BUCKET_NAME, filename)  # Already returns [{text, selected}]

    # Enhance text via Bedrock
    enhanced_text, text_tags = enhance_text_with_bedrock(text)  # Already returns [{text, selected}]

    # Limit number of tags just in case
    final_tags = text_tags[:5] + image_tags[:3]

    return jsonify({
        "enhanced_text": enhanced_text.strip(),  # clean final text
        "hashtags": final_tags,                  # already formatted
        "image_url": image_url
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

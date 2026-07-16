"""
S3-compatible object storage helpers: presigned upload URLs and presigned read URLs.
Works with AWS S3 or any S3-compatible provider (set S3_ENDPOINT_URL for the latter).
"""
import uuid

import boto3
from botocore.client import Config as BotoConfig

from core.config import get_settings

settings = get_settings()


def _client():
    return boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        endpoint_url=settings.S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        config=BotoConfig(signature_version="s3v4"),
    )


def build_object_key(user_id: str, filename: str) -> str:
    safe_name = filename.replace("/", "_")
    return f"reports/{user_id}/{uuid.uuid4()}_{safe_name}"


def presign_put(s3_key: str, content_type: str) -> str:
    """Return a short-lived URL the client can PUT the file to directly,
    so raw PHI bytes never pass through our own compute."""
    client = _client()
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key, "ContentType": content_type},
        ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
    )


def presign_get(s3_key: str) -> str:
    client = _client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key},
        ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
    )


def download_bytes(s3_key: str) -> bytes:
    client = _client()
    obj = client.get_object(Bucket=settings.S3_BUCKET, Key=s3_key)
    return obj["Body"].read()

import uuid

import boto3

from utils.config import config


def _client():
    return boto3.client("s3", region_name=config.aws_region)


def upload_bytes(data: bytes, key_prefix: str = "videos", content_type: str = "video/mp4") -> str:
    """Upload bytes to S3 and return the object key."""
    key = f"{key_prefix}/{uuid.uuid4()}.mp4"
    _client().put_object(
        Bucket=config.s3_bucket_name,
        Key=key,
        Body=data,
        ContentType=content_type,
    )
    return key


def presigned_url(key: str, expiry_seconds: int = 3600) -> str:
    """Return a presigned GET URL for the given S3 key."""
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": config.s3_bucket_name, "Key": key},
        ExpiresIn=expiry_seconds,
    )


def delete(key: str) -> None:
    """Delete an object from S3."""
    _client().delete_object(Bucket=config.s3_bucket_name, Key=key)

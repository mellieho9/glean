resource "aws_s3_bucket" "glean_video_temp" {
  bucket = "${var.app_name}-video-temp-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "glean_video_temp" {
  bucket = aws_s3_bucket.glean_video_temp.id

  rule {
    id     = "expire-temp-videos"
    status = "Enabled"
    filter {}
    expiration {
      days = 7
    }
  }
}

resource "aws_s3_bucket_public_access_block" "glean_video_temp" {
  bucket                  = aws_s3_bucket.glean_video_temp.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "glean_video_temp" {
  bucket = aws_s3_bucket.glean_video_temp.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

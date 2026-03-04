output "ecr_repository_url" {
  description = "ECR repository URL for pushing Docker images"
  value       = aws_ecr_repository.glean_backend.repository_url
}

output "alb_dns_name" {
  description = "Your API base URL — use this directly in the Chrome extension"
  value       = aws_lb.glean.dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.glean.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.glean_backend.name
}

output "s3_video_bucket_name" {
  description = "S3 bucket name for temporary video storage"
  value       = aws_s3_bucket.glean_video_temp.bucket
}

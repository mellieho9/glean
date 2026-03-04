variable "aws_region" {
  description = "AWS region to deploy into"
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name prefix for all resources"
  default     = "glean"
}

variable "environment" {
  description = "Deployment environment"
  default     = "prod"
}

variable "frontend_url" {
  description = "Vercel frontend URL (e.g. https://wandr.vercel.app)"
  type        = string
}

variable "alert_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

# Secrets — pass via TF_VAR_ environment variables, never commit values
variable "google_api_key" {
  sensitive = true
  type      = string
}

variable "supabase_url" {
  sensitive = true
  type      = string
}

variable "supabase_key" {
  sensitive = true
  type      = string
}

variable "supabase_service_role_key" {
  sensitive = true
  type      = string
}

variable "composio_api_key" {
  sensitive = true
  type      = string
}

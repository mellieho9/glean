resource "aws_secretsmanager_secret" "glean_api_keys" {
  name                    = "${var.app_name}/${var.environment}/api-keys"
  description             = "All API keys for Glean backend"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "glean_api_keys" {
  secret_id = aws_secretsmanager_secret.glean_api_keys.id

  secret_string = jsonencode({
    GOOGLE_API_KEY            = var.google_api_key
    SUPABASE_URL              = var.supabase_url
    SUPABASE_KEY              = var.supabase_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    COMPOSIO_API_KEY          = var.composio_api_key
    FRONTEND_URL              = var.frontend_url
  })
}

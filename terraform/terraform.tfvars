# Non-secret configuration — safe to commit
aws_region   = "us-east-1"
app_name     = "glean"
environment  = "prod"
frontend_url = "glean-mauve.vercel.app"
alert_email  = "melioraho9@gmail.com"

# ─────────────────────────────────────────────────────────────────────────────
# SECRETS — do NOT put values here. Pass via environment variables instead:
#
#   export TF_VAR_google_api_key="AIza..."
#   export TF_VAR_supabase_url="https://..."
#   export TF_VAR_supabase_key="sb_..."
#   export TF_VAR_supabase_service_role_key="eyJ..."
#   export TF_VAR_composio_api_key="ak_..."
# ─────────────────────────────────────────────────────────────────────────────

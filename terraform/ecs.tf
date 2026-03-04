resource "aws_ecs_cluster" "glean" {
  name = "${var.app_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.app_name}-backend"
  retention_in_days = 30
}

resource "aws_ecs_task_definition" "glean_backend" {
  family                   = "${var.app_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024" # 1 vCPU
  memory                   = "2048" # 2 GB
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "${var.app_name}-backend"
    image     = "${aws_ecr_repository.glean_backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]

    # Secrets injected individually from the JSON blob in Secrets Manager
    secrets = [
      { name = "GOOGLE_API_KEY", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:GOOGLE_API_KEY::" },
      { name = "SUPABASE_URL", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:SUPABASE_URL::" },
      { name = "SUPABASE_KEY", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:SUPABASE_KEY::" },
      { name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:SUPABASE_SERVICE_ROLE_KEY::" },
      { name = "COMPOSIO_API_KEY", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:COMPOSIO_API_KEY::" },
      { name = "FRONTEND_URL", valueFrom = "${aws_secretsmanager_secret.glean_api_keys.arn}:FRONTEND_URL::" }
    ]

    # Non-secret config
    environment = [
      { name = "AWS_REGION", value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.glean_video_temp.bucket },
      { name = "ENVIRONMENT", value = var.environment }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "glean_backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.glean.id
  task_definition = aws_ecs_task_definition.glean_backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true # Required in default VPC to reach ECR and Secrets Manager
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.glean_backend.arn
    container_name   = "${var.app_name}-backend"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]

  lifecycle {
    ignore_changes = [task_definition] # CI/CD handles image updates
  }
}

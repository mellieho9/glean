resource "aws_sns_topic" "glean_alerts" {
  name = "${var.app_name}-alerts"
}

resource "aws_sns_topic_subscription" "email_alert" {
  topic_arn = aws_sns_topic.glean_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Alarm: too many 5xx errors through the ALB
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.app_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Backend is returning too many 5xx errors"
  alarm_actions       = [aws_sns_topic.glean_alerts.arn]

  dimensions = {
    LoadBalancer = aws_lb.glean.arn_suffix
    TargetGroup  = aws_lb_target_group.glean_backend.arn_suffix
  }
}

# Alarm: ECS tasks failing / crash-looping
resource "aws_cloudwatch_metric_alarm" "ecs_task_failures" {
  alarm_name          = "${var.app_name}-ecs-task-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FailedTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 300
  statistic           = "Sum"
  threshold           = 2
  alarm_description   = "ECS tasks are failing repeatedly"
  alarm_actions       = [aws_sns_topic.glean_alerts.arn]

  dimensions = {
    ClusterName = aws_ecs_cluster.glean.name
    ServiceName = aws_ecs_service.glean_backend.name
  }
}

resource "aws_cloudwatch_dashboard" "glean" {
  dashboard_name = "${var.app_name}-backend"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title   = "ALB Request Count"
          metrics = [["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.glean.arn_suffix]]
          period  = 60
          stat    = "Sum"
          region  = var.aws_region
        }
      },
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6
        properties = {
          title   = "Target Response Time (p99)"
          metrics = [["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.glean.arn_suffix]]
          period  = 60
          stat    = "p99"
          region  = var.aws_region
        }
      },
      {
        type = "log", x = 0, y = 6, width = 24, height = 6
        properties = {
          title  = "ECS Application Logs"
          query  = "SOURCE '/ecs/${var.app_name}-backend' | fields @timestamp, @message | sort @timestamp desc | limit 50"
          region = var.aws_region
          view   = "table"
        }
      }
    ]
  })
}

resource "aws_lb" "glean" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "glean_backend" {
  name        = "${var.app_name}-backend-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip" # Required for Fargate

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }
}

# HTTP listener — forwards directly to ECS (no TLS for now)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.glean.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.glean_backend.arn
  }
}

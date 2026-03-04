data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ── ECS Execution Role (used by ECS control plane) ─────────────────────────
resource "aws_iam_role" "ecs_execution_role" {
  name               = "${var.app_name}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ecs_secrets_pull" {
  name = "${var.app_name}-ecs-secrets-pull"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [aws_secretsmanager_secret.glean_api_keys.arn]
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_secrets" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets_pull.arn
}

# ── ECS Task Role (used by the running container) ──────────────────────────
resource "aws_iam_role" "ecs_task_role" {
  name               = "${var.app_name}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_policy" "ecs_task_permissions" {
  name = "${var.app_name}-ecs-task-permissions"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.glean_video_temp.arn,
          "${aws_s3_bucket.glean_video_temp.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = [aws_secretsmanager_secret.glean_api_keys.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_permissions" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_task_permissions.arn
}

# ── GitHub Actions OIDC Role ────────────────────────────────────────────────
# TODO: Uncomment when ready to set up CI/CD
# Steps needed first:
#   1. Update YOUR_GITHUB_ORG below to your actual GitHub username/org
#   2. Run: aws iam create-open-id-connect-provider \
#             --url https://token.actions.githubusercontent.com \
#             --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
#             --client-id-list sts.amazonaws.com
#
# data "aws_iam_openid_connect_provider" "github" {
#   url = "https://token.actions.githubusercontent.com"
# }
#
# data "aws_iam_policy_document" "github_actions_assume" {
#   statement {
#     actions = ["sts:AssumeRoleWithWebIdentity"]
#     principals {
#       type        = "Federated"
#       identifiers = [data.aws_iam_openid_connect_provider.github.arn]
#     }
#     condition {
#       test     = "StringEquals"
#       variable = "token.actions.githubusercontent.com:sub"
#       values   = ["repo:YOUR_GITHUB_ORG/glean:ref:refs/heads/main"]
#     }
#   }
# }
#
# resource "aws_iam_role" "github_actions" {
#   name               = "${var.app_name}-github-actions-role"
#   assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
# }
#
# resource "aws_iam_policy" "github_actions_deploy" {
#   name = "${var.app_name}-github-actions-deploy"
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = ["ecr:GetAuthorizationToken","ecr:BatchCheckLayerAvailability",
#           "ecr:GetDownloadUrlForLayer","ecr:BatchGetImage","ecr:InitiateLayerUpload",
#           "ecr:UploadLayerPart","ecr:CompleteLayerUpload","ecr:PutImage"]
#         Resource = "*"
#       },
#       {
#         Effect   = "Allow"
#         Action   = ["ecs:RegisterTaskDefinition","ecs:DescribeTaskDefinition",
#           "ecs:UpdateService","ecs:DescribeServices"]
#         Resource = "*"
#       },
#       {
#         Effect   = "Allow"
#         Action   = ["iam:PassRole"]
#         Resource = [aws_iam_role.ecs_execution_role.arn, aws_iam_role.ecs_task_role.arn]
#       }
#     ]
#   })
# }
#
# resource "aws_iam_role_policy_attachment" "github_actions_deploy" {
#   role       = aws_iam_role.github_actions.name
#   policy_arn = aws_iam_policy.github_actions_deploy.arn
# }

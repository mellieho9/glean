import asyncio
import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Body, Path, Header, Query

from services.user import get_current_user
from services.schema_handler import get_schema_handler
from services.database import read_rows, create_row, update_rows, get_database_client

from services.agents.pipeline import (
    run_onboarding_chain,
    run_prompt_generation,
    process_video,
)


router = APIRouter(prefix="/agent", tags=["agent"])


def _get_authenticated_user(access_token: str):
    user = get_current_user(access_token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    return user


def _get_schema_row(user_id: str, source_id: str) -> Dict[str, Any]:
    db_client = get_database_client(use_service_role=True)
    result = read_rows(
        "schemas",
        filters={"user_id": user_id, "source_id": source_id},
        limit=1,
        client=db_client,
    )
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(
            status_code=404, detail="Schema not configured for this source"
        )
    return rows[0]


@router.get("/jobs")
async def list_jobs(
    access_token: str = Header(..., alias="Authorization"),
    status: str = Query(None),
) -> List[Dict[str, Any]]:
    user = _get_authenticated_user(access_token)
    db_client = get_database_client(use_service_role=True)
    filters = {"user_id": user.id}
    if status:
        filters["status"] = status
    result = read_rows(
        "jobs",
        filters=filters,
        select="id,status,integration,source_id,url,error,created_at,updated_at",
        order_by="created_at",
        ascending=False,
        client=db_client,
    )
    return result.get("data", [])


@router.get("/jobs/{job_id}")
async def get_job_status(
    job_id: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
) -> Dict[str, Any]:
    user = _get_authenticated_user(access_token)
    db_client = get_database_client(use_service_role=True)
    result = read_rows(
        "jobs",
        filters={"id": job_id, "user_id": user.id},
        limit=1,
        client=db_client,
    )
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Job not found")

    job = rows[0]
    response = {
        "job_id": job["id"],
        "status": job["status"],
        "url": job.get("url"),
        "created_at": job.get("created_at"),
    }
    if job["status"] == "completed":
        raw_result = job.get("result")
        response["result"] = (
            json.loads(raw_result) if isinstance(raw_result, str) else raw_result
        )
    elif job["status"] == "failed":
        response["error"] = job.get("error")
    return response


@router.post("/{integration}/onboarding/questions")
async def generate_questions(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Body(..., embed=True),
) -> Dict[str, Any]:
    user = _get_authenticated_user(access_token)
    try:
        handler = get_schema_handler(user, integration)
        schema = handler.get_schema(source_id)
        tag = schema.get("title", source_id)

        result = await run_onboarding_chain(schema, tag, db_type=integration)
        return {
            "source_id": source_id,
            "tag": tag,
            "schema_summary": result.schema_summary,
            "questions": [q.model_dump() for q in result.questions],
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Question generation failed: {str(e)}"
        ) from e


@router.post("/{integration}/onboarding/configure")
async def configure_schema(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    source_id: str = Body(...),
    user_answers: Dict[str, Any] = Body(...),
) -> Dict[str, Any]:
    user = _get_authenticated_user(access_token)
    try:
        handler = get_schema_handler(user, integration)
        schema = handler.get_schema(source_id)
        tag = schema.get("title", source_id)

        extraction_config = await run_prompt_generation(
            schema, tag, user_answers, db_type=integration
        )

        config_dict = (
            extraction_config.model_dump()
            if hasattr(extraction_config, "model_dump")
            else extraction_config
        )

        db_client = get_database_client(use_service_role=True)

        existing = read_rows(
            "schemas",
            filters={"user_id": user.id, "source_id": source_id},
            limit=1,
            client=db_client,
        )
        if existing.get("data"):
            update_rows(
                "schemas",
                filters={"user_id": user.id, "source_id": source_id},
                data={
                    "schema": schema,
                    "prompt": json.dumps(config_dict),
                    "slug": integration,
                },
                client=db_client,
            )
        else:
            create_row(
                "schemas",
                {
                    "source_id": source_id,
                    "user_id": user.id,
                    "version": 1,
                    "schema": schema,
                    "slug": integration,
                    "prompt": json.dumps(config_dict),
                },
                client=db_client,
            )

        return {
            "source_id": source_id,
            "configured": True,
            "extraction_config": config_dict,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Configuration failed: {str(e)}"
        ) from e


async def _run_job(job_id: str, user, integration: str, youtube_url: str, source_id: str):
    db_client = get_database_client(use_service_role=True)
    try:
        update_rows("jobs", filters={"id": job_id}, data={"status": "processing"}, client=db_client)

        schema_row = _get_schema_row(user.id, source_id)
        raw_prompt = schema_row["prompt"]
        extraction_config = (
            json.loads(raw_prompt) if isinstance(raw_prompt, str) else raw_prompt
        )

        handler = get_schema_handler(user, integration)
        result = await process_video(
            youtube_url=youtube_url,
            extraction_config=extraction_config,
            handler=handler,
            source_id=source_id,
        )

        update_rows(
            "jobs",
            filters={"id": job_id},
            data={
                "status": "completed" if result.success else "failed",
                "result": json.dumps({
                    "extracted_data": result.extracted_data,
                    "critique": result.critique,
                    "attempts": result.attempts,
                }),
                "error": result.error,
            },
            client=db_client,
        )
    except Exception as e:
        update_rows(
            "jobs",
            filters={"id": job_id},
            data={"status": "failed", "error": str(e)},
            client=db_client,
        )


@router.post("/{integration}/process")
async def process_video_endpoint(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    youtube_url: str = Body(...),
    source_id: str = Body(...),
) -> Dict[str, Any]:
    user = _get_authenticated_user(access_token)
    try:
        # Validate schema exists before creating the job
        _get_schema_row(user.id, source_id)

        db_client = get_database_client(use_service_role=True)
        job_row = create_row(
            "jobs",
            {
                "user_id": user.id,
                "status": "pending",
                "integration": integration,
                "source_id": source_id,
                "url": youtube_url,
            },
            client=db_client,
        )
        job_id = job_row["data"]["id"]

        asyncio.create_task(_run_job(job_id, user, integration, youtube_url, source_id))

        return {"job_id": job_id, "status": "pending"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to submit job: {str(e)}"
        ) from e

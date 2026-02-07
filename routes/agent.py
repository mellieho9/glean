import json
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body, Path, Header

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
    result = read_rows(
        "schemas",
        filters={"user_id": user_id, "source_id": source_id},
        limit=1,
    )
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(
            status_code=404, detail="Schema not configured for this source"
        )
    return rows[0]


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

        questions = await run_onboarding_chain(schema, tag, db_type=integration)
        return {"source_id": source_id, "tag": tag, "questions": questions}
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


@router.post("/{integration}/process")
async def process_video_endpoint(
    integration: str = Path(...),
    access_token: str = Header(..., alias="Authorization"),
    youtube_url: str = Body(...),
    source_id: str = Body(...),
) -> Dict[str, Any]:
    user = _get_authenticated_user(access_token)
    try:
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

        return {
            "success": result.success,
            "extracted_data": result.extracted_data,
            "critique": result.critique,
            "attempts": result.attempts,
            "error": result.error,
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Video processing failed: {str(e)}"
        ) from e

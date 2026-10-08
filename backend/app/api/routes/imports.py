from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Response, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.schemas.import_job import (
    ImportPreviewResponse,
    ImportExecuteRequest,
    ImportJobOut,
)
from app.services.import_service import ImportService

router = APIRouter()


class TextPreviewRequest(BaseModel):
    csv_text: str
    filename: Optional[str] = "statement.csv"


@router.post("/preview", response_model=ImportPreviewResponse)
async def preview_import_file(
    file: Optional[UploadFile] = File(None),
    csv_text: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Parse uploaded CSV or pasted text, detect delimiters, suggest column mappings,
    validate rows, and run database duplicate checks against existing user records.
    """
    content = ""
    filename = "statement.csv"

    if file:
        filename = file.filename or "statement.csv"
        raw_bytes = await file.read()
        try:
            content = raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content = raw_bytes.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not decode file encoding. Please upload a UTF-8 CSV.",
                )
    elif csv_text:
        content = csv_text
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either an uploaded file or csv_text must be provided.",
        )

    return await ImportService.parse_and_preview(
        db=db,
        user_id=current_user.id,
        content=content,
        filename=filename,
    )


@router.post("/preview/raw", response_model=ImportPreviewResponse)
async def preview_import_raw(
    payload: TextPreviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    JSON endpoint for previewing CSV string content directly.
    """
    return await ImportService.parse_and_preview(
        db=db,
        user_id=current_user.id,
        content=payload.csv_text,
        filename=payload.filename or "statement.csv",
    )


@router.post("/execute", response_model=ImportJobOut, status_code=status.HTTP_201_CREATED)
async def execute_import(
    payload: ImportExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Commit normalized transactions to the database, skipping duplicates if specified,
    updating account balance, and creating an audit ImportJob record.
    """
    import_job = await ImportService.execute_import(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )
    return ImportJobOut.model_validate(import_job)


@router.get("/history", response_model=List[ImportJobOut])
async def get_import_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve historical import audit records for current user.
    """
    jobs = await ImportService.get_history(db=db, user_id=current_user.id)
    return [ImportJobOut.model_validate(j) for j in jobs]


@router.get("/template")
async def download_template():
    """
    Delivers a clean CSV template file for direct download.
    """
    csv_data = ImportService.get_sample_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="spendiq_sample_statement.csv"'},
    )

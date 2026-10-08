import csv
import io
import re
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.import_job import ImportJob
from app.schemas.import_job import (
    ImportPreviewRow,
    ImportPreviewResponse,
    ImportExecuteRequest,
)


class ImportService:
    """
    Intelligent Data Ingestion & Deduplication Service.
    Parses CSV statements, heuristically detects column mappings, validates numeric and date formats,
    flags potential duplicate records against historical user transactions, and executes batch commits.
    """

    SAMPLE_CSV_CONTENT = (
        "Date,Merchant,Category,Amount,Direction,Description\n"
        "2026-09-01,Trader Joe's,Groceries,85.40,EXPENSE,Weekly organic groceries\n"
        "2026-09-02,Starbucks,Dining,6.75,EXPENSE,Morning latte\n"
        "2026-09-03,Acme Corp,Salary,3500.00,INCOME,Bi-weekly payroll deposit\n"
        "2026-09-04,Vanguard,Investment,500.00,INVESTMENT,Index fund recurring deposit\n"
        "2026-09-05,Amazon,Shopping,42.99,EXPENSE,Household essentials\n"
    )

    @classmethod
    def get_sample_csv(cls) -> str:
        """Returns standard CSV template content."""
        return cls.SAMPLE_CSV_CONTENT

    @classmethod
    async def get_history(
        cls,
        db: AsyncSession,
        user_id: str,
        limit: int = 20,
    ) -> List[ImportJob]:
        """Fetch past import jobs audit records for the user."""
        stmt = (
            select(ImportJob)
            .where(ImportJob.user_id == user_id)
            .order_by(desc(ImportJob.created_at))
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @classmethod
    def _detect_delimiter(cls, text_sample: str) -> str:
        """Detects delimiter among comma, semicolon, or tab."""
        first_few_lines = "\n".join(text_sample.splitlines()[:5])
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(first_few_lines, delimiters=";,	")
            return dialect.delimiter
        except Exception:
            # Fallback counts
            if text_sample.count(";") > text_sample.count(",") and text_sample.count(";") > text_sample.count("\t"):
                return ";"
            if text_sample.count("\t") > text_sample.count(","):
                return "\t"
            return ","

    @classmethod
    def _suggest_mappings(cls, headers: List[str]) -> Dict[str, str]:
        """Heuristically matches CSV column names to internal SpendIQ fields."""
        mappings: Dict[str, str] = {}
        for h in headers:
            norm = h.strip().lower().replace("_", " ").replace("-", " ")
            if any(k in norm for k in ["date", "time", "posted", "trans date"]):
                mappings[h] = "occurred_at"
            elif any(k in norm for k in ["amount", "total", "price", "cost", "sum", "value", "debit", "credit"]):
                mappings[h] = "amount"
            elif any(k in norm for k in ["merchant", "payee", "store", "vendor", "retailer"]):
                mappings[h] = "merchant_name"
            elif any(k in norm for k in ["category", "classification", "group", "tag"]):
                mappings[h] = "category_name"
            elif any(k in norm for k in ["direction", "transaction type", "type", "trans type"]):
                mappings[h] = "direction"
            elif any(k in norm for k in ["description", "memo", "note", "details", "narration"]):
                mappings[h] = "description"

        # If no merchant column mapped, fallback to description if present
        if "merchant_name" not in mappings.values():
            for h, mapped in list(mappings.items()):
                if mapped == "description":
                    mappings[h] = "merchant_name"
                    break

        return mappings

    @classmethod
    def _parse_flexible_date(cls, val: str) -> Optional[datetime]:
        """Tries various international date formats and returns timezone-aware UTC datetime."""
        cleaned = val.strip()
        formats = [
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%m-%d-%Y",
            "%d-%m-%Y",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%b %d, %Y",
            "%d %b %Y",
            "%B %d, %Y",
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(cleaned, fmt)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                continue
        return None

    @classmethod
    def _parse_flexible_amount(cls, val: str) -> Tuple[Optional[Decimal], Optional[str]]:
        """
        Parses currency strings into (amount, inferred_direction).
        Handles dollar signs, commas, parenthesis negatives (e.g. `(45.00)` -> 45.00 EXPENSE).
        """
        cleaned = val.strip().replace("$", "").replace("€", "").replace("£", "").replace(",", "")
        if not cleaned:
            return None, None

        inferred_dir = None
        # Parenthesized negative: (50.00) -> 50.00 EXPENSE
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = cleaned[1:-1]
            inferred_dir = "EXPENSE"

        try:
            num = Decimal(cleaned)
            if num < 0:
                inferred_dir = "EXPENSE"
                num = abs(num)
            return num, inferred_dir
        except (InvalidOperation, ValueError):
            return None, None

    @classmethod
    async def parse_and_preview(
        cls,
        db: AsyncSession,
        user_id: str,
        content: str,
        filename: str = "statement.csv",
    ) -> ImportPreviewResponse:
        """
        Parses CSV statement text, checks validation, runs duplicate detection against
        existing user transactions, and returns structured preview with suggested mappings.
        """
        if not content.strip():
            return ImportPreviewResponse(
                headers=[],
                suggested_mappings={},
                preview_rows=[],
                total_rows=0,
                valid_rows=0,
                duplicate_rows=0,
                error_rows=0,
            )

        delimiter = cls._detect_delimiter(content)
        f = io.StringIO(content.strip())
        reader = csv.reader(f, delimiter=delimiter)

        try:
            headers = [h.strip() for h in next(reader)]
        except StopIteration:
            return ImportPreviewResponse(
                headers=[],
                suggested_mappings={},
                preview_rows=[],
                total_rows=0,
                valid_rows=0,
                duplicate_rows=0,
                error_rows=0,
            )

        mappings = cls._suggest_mappings(headers)

        # Inverse mapping: field -> header index
        field_to_idx: Dict[str, int] = {}
        for idx, h in enumerate(headers):
            field = mappings.get(h)
            if field and field not in field_to_idx:
                field_to_idx[field] = idx

        raw_rows: List[List[str]] = []
        for r in reader:
            if any(cell.strip() for cell in r):
                raw_rows.append([cell.strip() for cell in r])

        # Pre-fetch existing transactions for duplicate detection
        existing_txs_stmt = (
            select(Transaction)
            .where(Transaction.user_id == user_id)
            .order_by(desc(Transaction.occurred_at))
            .limit(1000)
        )
        existing_res = await db.execute(existing_txs_stmt)
        existing_transactions = list(existing_res.scalars().all())

        preview_rows: List[ImportPreviewRow] = []
        valid_count = 0
        duplicate_count = 0
        error_count = 0

        for r_idx, row_vals in enumerate(raw_rows):
            raw_dict = {
                headers[i] if i < len(headers) else f"col_{i}": row_vals[i] if i < len(row_vals) else ""
                for i in range(max(len(headers), len(row_vals)))
            }

            row_error: Optional[str] = None
            occurred_at: Optional[datetime] = None
            amount: Optional[Decimal] = None
            direction = "EXPENSE"
            merchant_name = "Unknown Merchant"
            category_name = "Uncategorized"
            description = ""

            # 1. Parse Date
            if "occurred_at" in field_to_idx and field_to_idx["occurred_at"] < len(row_vals):
                date_str = row_vals[field_to_idx["occurred_at"]]
                occurred_at = cls._parse_flexible_date(date_str)
                if not occurred_at:
                    row_error = f"Invalid date format: '{date_str}'"
            else:
                occurred_at = datetime.now(timezone.utc)

            # 2. Parse Amount
            if "amount" in field_to_idx and field_to_idx["amount"] < len(row_vals):
                amt_str = row_vals[field_to_idx["amount"]]
                parsed_amt, inferred_dir = cls._parse_flexible_amount(amt_str)
                if parsed_amt is None or parsed_amt <= 0:
                    row_error = f"Invalid monetary amount: '{amt_str}'"
                else:
                    amount = parsed_amt
                    if inferred_dir:
                        direction = inferred_dir
            else:
                row_error = "Missing amount column"

            # 3. Parse Merchant & Description
            if "merchant_name" in field_to_idx and field_to_idx["merchant_name"] < len(row_vals):
                m_val = row_vals[field_to_idx["merchant_name"]].strip()
                if m_val:
                    merchant_name = m_val

            if "description" in field_to_idx and field_to_idx["description"] < len(row_vals):
                description = row_vals[field_to_idx["description"]].strip()

            if merchant_name == "Unknown Merchant" and description:
                merchant_name = description[:50]

            # 4. Parse Category
            if "category_name" in field_to_idx and field_to_idx["category_name"] < len(row_vals):
                cat_val = row_vals[field_to_idx["category_name"]].strip()
                if cat_val:
                    category_name = cat_val

            # 5. Parse Direction
            if "direction" in field_to_idx and field_to_idx["direction"] < len(row_vals):
                dir_val = row_vals[field_to_idx["direction"]].strip().upper()
                if any(k in dir_val for k in ["INCOME", "CREDIT", "DEPOSIT"]):
                    direction = "INCOME"
                elif any(k in dir_val for k in ["INVEST", "PORTFOLIO", "BROKERAGE"]):
                    direction = "INVESTMENT"
                elif any(k in dir_val for k in ["EXPENSE", "DEBIT", "PAYMENT", "CHARGE"]):
                    direction = "EXPENSE"

            # 6. Duplicate Detection
            is_duplicate = False
            duplicate_reason: Optional[str] = None

            if occurred_at and amount and not row_error:
                # Look for matching record within +/- 1 calendar day with exact amount and matching merchant
                for ex in existing_transactions:
                    amt_match = abs(ex.amount - amount) < Decimal("0.01")
                    date_diff = abs((ex.occurred_at.date() - occurred_at.date()).days) <= 1
                    norm_curr_m = re.sub(r"[^a-zA-Z0-9]", "", merchant_name.lower())
                    norm_ex_m = re.sub(r"[^a-zA-Z0-9]", "", ex.merchant_name.lower())
                    merchant_match = (
                        norm_curr_m in norm_ex_m
                        or norm_ex_m in norm_curr_m
                        or ex.merchant_name.lower() == merchant_name.lower()
                    )

                    if amt_match and date_diff and merchant_match:
                        is_duplicate = True
                        duplicate_reason = (
                            f"Matches transaction '{ex.merchant_name}' on {ex.occurred_at.strftime('%Y-%m-%d')} "
                            f"(${float(ex.amount):,.2f})"
                        )
                        break

            if row_error:
                error_count += 1
            else:
                valid_count += 1
                if is_duplicate:
                    duplicate_count += 1

            preview_rows.append(
                ImportPreviewRow(
                    row_index=r_idx + 1,
                    occurred_at=occurred_at,
                    amount=amount,
                    currency="USD",
                    direction=direction,
                    category_name=category_name,
                    merchant_name=merchant_name,
                    description=description,
                    is_duplicate=is_duplicate,
                    duplicate_reason=duplicate_reason,
                    validation_error=row_error,
                    raw_data=raw_dict,
                )
            )

        return ImportPreviewResponse(
            headers=headers,
            suggested_mappings=mappings,
            preview_rows=preview_rows,
            total_rows=len(preview_rows),
            valid_rows=valid_count,
            duplicate_rows=duplicate_count,
            error_rows=error_count,
        )

    @classmethod
    async def execute_import(
        cls,
        db: AsyncSession,
        user_id: str,
        payload: ImportExecuteRequest,
    ) -> ImportJob:
        """
        Commits verified rows to database, skips duplicates if requested,
        optionally links account, updates account balances, and creates audit ImportJob record.
        """
        imported_count = 0
        duplicate_count = 0
        failed_count = 0

        # Verify account if provided
        target_account: Optional[Account] = None
        if payload.account_id:
            acc_stmt = select(Account).where(
                Account.id == payload.account_id,
                Account.user_id == user_id,
            )
            acc_res = await db.execute(acc_stmt)
            target_account = acc_res.scalar_one_or_none()

        for row in payload.rows:
            if row.is_duplicate and payload.skip_duplicates:
                duplicate_count += 1
                continue

            try:
                tx = Transaction(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    account_id=target_account.id if target_account else None,
                    occurred_at=row.occurred_at,
                    amount=row.amount,
                    currency=row.currency,
                    direction=row.direction.upper(),
                    category_name=row.category_name or "Uncategorized",
                    merchant_name=row.merchant_name or "Unknown Merchant",
                    description=row.description or "",
                    source="CSV_IMPORT",
                )
                db.add(tx)
                imported_count += 1

                # Update account balance if target account specified
                if target_account:
                    if row.direction.upper() == "INCOME":
                        target_account.balance += row.amount
                    elif row.direction.upper() in ["EXPENSE", "INVESTMENT"]:
                        target_account.balance -= row.amount

            except Exception:
                failed_count += 1

        # Create ImportJob audit entry
        import_job = ImportJob(
            id=str(uuid.uuid4()),
            user_id=user_id,
            filename=payload.filename,
            total_rows=len(payload.rows),
            imported_rows=imported_count,
            duplicate_rows=duplicate_count,
            failed_rows=failed_count,
            status="COMPLETED" if failed_count == 0 else "PARTIAL",
            created_at=datetime.now(timezone.utc),
        )
        db.add(import_job)

        await db.commit()
        await db.refresh(import_job)

        return import_job

"""
SpendIQ Background Worker Service
Processes asynchronous financial analytics jobs, scheduled ML model updates,
anomaly scans, and statements processing.
"""
import asyncio
import logging
import signal
import sys
from datetime import datetime, timezone
from typing import Optional

from app.core.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | worker | %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
logger = logging.getLogger("spendiq.worker")


class SpendIQWorker:
    def __init__(self):
        self._running = False
        self._shutdown_event = asyncio.Event()
        self._redis_client = None

    async def initialize(self):
        """Initialize connections to database and message broker (Redis)."""
        logger.info("Initializing SpendIQ Worker (version %s)...", settings.APP_VERSION)
        logger.info("Environment: %s", settings.ENVIRONMENT)

        if settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis
                self._redis_client = aioredis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self._redis_client.ping()
                logger.info("Successfully connected to Redis broker at %s", settings.REDIS_URL)
            except Exception as e:
                logger.warning("Redis connection failed (%s); running worker in local polling mode", e)
                self._redis_client = None
        else:
            logger.info("No REDIS_URL configured; running in standalone scheduler mode")

    async def run_periodic_tasks(self):
        """Periodic background tasks: anomaly monitoring, forecast maintenance."""
        iteration = 0
        while self._running:
            iteration += 1
            logger.info("Worker heartbeat #%d | Status: ACTIVE | UTC: %s", iteration, datetime.now(timezone.utc).isoformat())

            # Perform periodic maintenance tasks here:
            # - Scan for pending ImportJob records
            # - Check for stale forecast caches
            # - Purge expired ephemeral records

            try:
                # Sleep interval between maintenance checks (e.g., 60 seconds)
                await asyncio.wait_for(self._shutdown_event.wait(), timeout=60.0)
                break  # If shutdown_event triggered, exit cleanly
            except asyncio.TimeoutError:
                continue

    async def start(self):
        self._running = True
        await self.initialize()
        logger.info("SpendIQ Worker running. Listening for asynchronous jobs...")

        # Setup shutdown signal handling
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            try:
                loop.add_signal_handler(sig, self.request_stop)
            except NotImplementedError:
                # Windows doesn't support add_signal_handler for all signals
                pass

        try:
            await self.run_periodic_tasks()
        except asyncio.CancelledError:
            logger.info("Worker task cancelled")
        finally:
            await self.shutdown()

    def request_stop(self):
        logger.info("Shutdown signal received. Initiating graceful worker shutdown...")
        self._running = False
        self._shutdown_event.set()

    async def shutdown(self):
        logger.info("Worker gracefully shutting down...")
        if self._redis_client:
            try:
                await self._redis_client.close()
                logger.info("Redis connection closed")
            except Exception as e:
                logger.error("Error closing Redis connection: %s", e)
        logger.info("SpendIQ Worker shutdown complete")


def main():
    worker = SpendIQWorker()
    try:
        asyncio.run(worker.start())
    except KeyboardInterrupt:
        logger.info("Worker interrupted by user")
    sys.exit(0)


if __name__ == "__main__":
    main()

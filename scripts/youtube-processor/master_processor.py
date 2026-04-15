#!/usr/bin/env python3
"""
WealthClaude Master Processor
Runs all processors together in a single script.

Processors:
1. Account Monitor - Checks Instagram accounts for new reels (every 1 hour)
2. Reel Processor - Processes queued reels from dashboard (every 1 minute)
3. Video Processor - Processes YouTube videos (every 1 minute)
4. Cloudinary Cleanup - Deletes old videos (every 6 hours)

Usage:
    python master_processor.py           # Run all processors
    python master_processor.py --no-youtube  # Skip YouTube processor
    
To run in background on Windows:
    pythonw master_processor.py
    
Or create a scheduled task in Windows Task Scheduler.
"""

import os
import sys
import time
import threading
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / '.env', override=True)
load_dotenv(override=True)  # Also load local .env if it exists

# ============================================
# Configuration
# ============================================
ENABLE_ACCOUNT_MONITOR = True      # Check Instagram accounts for new reels
ENABLE_REEL_PROCESSOR = True       # Process queued reels from dashboard
ENABLE_VIDEO_PROCESSOR = True      # Process YouTube videos
ENABLE_CLOUDINARY_CLEANUP = True   # Delete old Cloudinary videos

# Intervals (in seconds)
ACCOUNT_MONITOR_INTERVAL = 10800   # 3 hours (for 300 req/month limit)
REEL_PROCESSOR_INTERVAL = 60       # 1 minute
VIDEO_PROCESSOR_INTERVAL = 60      # 1 minute
CLOUDINARY_CLEANUP_INTERVAL = 21600  # 6 hours

# Operating hours (24-hour format)
OPERATING_START_HOUR = int(os.getenv("OPERATING_START_HOUR", "7"))   # 7 AM
OPERATING_END_HOUR = int(os.getenv("OPERATING_END_HOUR", "22"))      # 10 PM

# Logging setup
LOG_DIR = Path("./logs")
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / f"master_{datetime.now().strftime('%Y%m%d')}.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("Master")


# ============================================
# Operating Hours Check
# ============================================
def is_within_operating_hours() -> bool:
    """Check if current time is within operating hours (7 AM - 10 PM by default)."""
    current_hour = datetime.now().hour
    return OPERATING_START_HOUR <= current_hour < OPERATING_END_HOUR


def get_seconds_until_operating():
    """Get seconds until next operating period starts."""
    now = datetime.now()
    
    if now.hour >= OPERATING_END_HOUR:
        # After end hour - next run is tomorrow at start hour
        tomorrow = now + timedelta(days=1)
        next_run = tomorrow.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    elif now.hour < OPERATING_START_HOUR:
        # Before start hour - next run is today at start hour
        next_run = now.replace(hour=OPERATING_START_HOUR, minute=0, second=0, microsecond=0)
    else:
        return 0
    
    return max((next_run - now).total_seconds(), 60)


# ============================================
# Import Processors
# ============================================
try:
    from account_monitor import check_all_accounts, cleanup_old_videos
    ACCOUNT_MONITOR_AVAILABLE = True
    logger.info("Account Monitor loaded")
except ImportError as e:
    ACCOUNT_MONITOR_AVAILABLE = False
    logger.warning(f"Account Monitor not available: {e}")

try:
    from reel_processor import process_pending_reels
    REEL_PROCESSOR_AVAILABLE = True
    logger.info("Reel Processor loaded")
except ImportError as e:
    REEL_PROCESSOR_AVAILABLE = False
    logger.warning(f"Reel Processor not available: {e}")

try:
    from processor import process_pending_videos
    VIDEO_PROCESSOR_AVAILABLE = True
    logger.info("Video Processor loaded")
except ImportError as e:
    VIDEO_PROCESSOR_AVAILABLE = False
    logger.warning(f"Video Processor not available: {e}")


# ============================================
# Worker Functions
# ============================================
def account_monitor_worker():
    """Worker thread for monitoring Instagram accounts."""
    worker_logger = logging.getLogger("AccountMonitor")
    worker_logger.info("Account Monitor started")
    worker_logger.info(f"Operating hours: {OPERATING_START_HOUR}:00 - {OPERATING_END_HOUR}:00")
    
    while True:
        try:
            # Check if within operating hours
            if not is_within_operating_hours():
                sleep_seconds = get_seconds_until_operating()
                worker_logger.info(f"Outside operating hours. Sleeping {sleep_seconds // 3600:.1f} hours...")
                time.sleep(sleep_seconds)
                continue
            
            if ACCOUNT_MONITOR_AVAILABLE and ENABLE_ACCOUNT_MONITOR:
                worker_logger.info("Checking monitored accounts...")
                check_all_accounts()
        except Exception as e:
            worker_logger.error(f"Error: {e}")
        
        time.sleep(ACCOUNT_MONITOR_INTERVAL)


def reel_processor_worker():
    """Worker thread for processing queued reels."""
    worker_logger = logging.getLogger("ReelProcessor")
    worker_logger.info("Reel Processor started")
    
    while True:
        try:
            if REEL_PROCESSOR_AVAILABLE and ENABLE_REEL_PROCESSOR:
                process_pending_reels()
        except Exception as e:
            worker_logger.error(f"Error: {e}")
        
        time.sleep(REEL_PROCESSOR_INTERVAL)


def video_processor_worker():
    """Worker thread for processing YouTube videos."""
    worker_logger = logging.getLogger("VideoProcessor")
    worker_logger.info("Video Processor started")
    
    while True:
        try:
            if VIDEO_PROCESSOR_AVAILABLE and ENABLE_VIDEO_PROCESSOR:
                process_pending_videos()
        except Exception as e:
            worker_logger.error(f"Error: {e}")
        
        time.sleep(VIDEO_PROCESSOR_INTERVAL)


def cloudinary_cleanup_worker():
    """Worker thread for cleaning up old Cloudinary videos."""
    worker_logger = logging.getLogger("CloudinaryCleanup")
    worker_logger.info("Cloudinary Cleanup started")
    
    while True:
        try:
            if ACCOUNT_MONITOR_AVAILABLE and ENABLE_CLOUDINARY_CLEANUP:
                worker_logger.info("Running cleanup...")
                cleanup_old_videos()
        except Exception as e:
            worker_logger.error(f"Error: {e}")
        
        time.sleep(CLOUDINARY_CLEANUP_INTERVAL)


# ============================================
# Status Display
# ============================================
def display_status():
    """Display current status of all processors."""
    print("\n" + "=" * 60)
    print("WealthClaude Master Processor")
    print("=" * 60)
    print(f"\nStarted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Operating hours: {OPERATING_START_HOUR}:00 - {OPERATING_END_HOUR}:00")
    print("\nProcessors Status:")
    print("-" * 40)
    
    processors = [
        ("Account Monitor", ENABLE_ACCOUNT_MONITOR and ACCOUNT_MONITOR_AVAILABLE, f"Every {ACCOUNT_MONITOR_INTERVAL // 3600} hours"),
        ("Reel Processor", ENABLE_REEL_PROCESSOR and REEL_PROCESSOR_AVAILABLE, f"Every {REEL_PROCESSOR_INTERVAL // 60} min"),
        ("Video Processor", ENABLE_VIDEO_PROCESSOR and VIDEO_PROCESSOR_AVAILABLE, f"Every {VIDEO_PROCESSOR_INTERVAL // 60} min"),
        ("Cloudinary Cleanup", ENABLE_CLOUDINARY_CLEANUP and ACCOUNT_MONITOR_AVAILABLE, f"Every {CLOUDINARY_CLEANUP_INTERVAL // 3600} hours"),
    ]
    
    for name, enabled, interval in processors:
        status = "Running" if enabled else "Disabled"
        print(f"  {name}: {status} ({interval})")
    
    print("\n" + "-" * 40)
    print("Press Ctrl+C to stop all processors")
    print("=" * 60 + "\n")


# ============================================
# Main Entry Point
# ============================================
def main():
    # Parse arguments
    skip_youtube = "--no-youtube" in sys.argv
    
    if skip_youtube:
        global ENABLE_VIDEO_PROCESSOR
        ENABLE_VIDEO_PROCESSOR = False
    
    # Display status
    display_status()
    
    # Create worker threads
    threads = []
    
    if ENABLE_ACCOUNT_MONITOR and ACCOUNT_MONITOR_AVAILABLE:
        t = threading.Thread(target=account_monitor_worker, daemon=True, name="AccountMonitor")
        threads.append(t)
    
    if ENABLE_REEL_PROCESSOR and REEL_PROCESSOR_AVAILABLE:
        t = threading.Thread(target=reel_processor_worker, daemon=True, name="ReelProcessor")
        threads.append(t)
    
    if ENABLE_VIDEO_PROCESSOR and VIDEO_PROCESSOR_AVAILABLE:
        t = threading.Thread(target=video_processor_worker, daemon=True, name="VideoProcessor")
        threads.append(t)
    
    if ENABLE_CLOUDINARY_CLEANUP and ACCOUNT_MONITOR_AVAILABLE:
        t = threading.Thread(target=cloudinary_cleanup_worker, daemon=True, name="CloudinaryCleanup")
        threads.append(t)
    
    # Start all threads
    for t in threads:
        t.start()
        logger.info(f"Started thread: {t.name}")
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(60)
            # Optional: Log heartbeat
            logger.debug(f"Heartbeat - {len(threads)} threads running")
    except KeyboardInterrupt:
        logger.info("\nShutting down...")
        print("\nAll processors stopped.")


if __name__ == "__main__":
    main()

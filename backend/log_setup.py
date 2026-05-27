from dome_core.logging import configure_logging, get_logger


def setup_logging() -> None:
    configure_logging()


__all__ = ["setup_logging", "get_logger"]

"""Lightweight subset of the Tenacity API used for offline retries."""
from __future__ import annotations

import asyncio
from typing import Any, Awaitable, Callable, Optional, Type


class RetryError(Exception):
    """Raised when retry attempts are exhausted."""


class _AttemptManager:
    def __init__(self, retrying: "AsyncRetrying") -> None:
        self.retrying = retrying
        self.should_retry = False

    def __enter__(self) -> "_AttemptManager":
        return self

    def __exit__(self, exc_type: Optional[Type[BaseException]], exc: Optional[BaseException], tb: Any) -> bool:
        if exc_type is None:
            self.retrying.last_exception = None
            self.should_retry = False
            return False

        self.retrying.last_exception = exc
        self.should_retry = self.retrying.retry(exc)
        if not self.should_retry:
            return False
        return True


class AsyncRetrying:
    def __init__(
        self,
        retry: Callable[[BaseException], bool],
        wait: Callable[[int], float],
        stop: Callable[[int], bool],
        reraise: bool = False,
    ) -> None:
        self.retry = retry
        self.wait = wait
        self.stop = stop
        self.reraise = reraise
        self.attempt_number = 0
        self.last_exception: Optional[BaseException] = None

    def __aiter__(self):
        return self._iterate()

    async def _iterate(self):
        while True:
            self.attempt_number += 1
            attempt = _AttemptManager(self)
            yield attempt

            if attempt.should_retry and not self.stop(self.attempt_number):
                await asyncio.sleep(self.wait(self.attempt_number))
                continue

            if attempt.should_retry and self.stop(self.attempt_number):
                if self.reraise and self.last_exception:
                    raise self.last_exception
                raise StopAsyncIteration

            break


def retry_if_exception_type(exc_type: Type[BaseException]) -> Callable[[BaseException], bool]:
    def predicate(exc: BaseException) -> bool:
        return isinstance(exc, exc_type)

    return predicate


def wait_exponential(multiplier: float = 1.0, min: float = 0.0, max: Optional[float] = None) -> Callable[[int], float]:
    def waiter(attempt_number: int) -> float:
        delay = max(min, multiplier * (2 ** (attempt_number - 1)))
        if max is not None:
            delay = min(delay, max)
        return delay

    return waiter


def stop_after_attempt(max_attempt_number: int) -> Callable[[int], bool]:
    def stopper(attempt_number: int) -> bool:
        return attempt_number >= max_attempt_number

    return stopper


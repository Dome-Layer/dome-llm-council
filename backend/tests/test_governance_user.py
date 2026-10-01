"""user_id in LLM Council's governance events (Sprint C item 4)."""

import json
from unittest.mock import patch

from fastapi.testclient import TestClient
from starlette.requests import Request

import main
from auth import optional_user_id

USER_ID = "6f1d2c3b-0000-4000-8000-000000000002"


async def _fake_deliberation(*_args, **_kwargs):
    yield json.dumps({"type": "verdict", "data": {"summary": "ok"}})
    yield json.dumps({"type": "governance_event", "agent_id": "llm-council"})


def _request(headers: list[tuple[bytes, bytes]]) -> Request:
    return Request({"type": "http", "headers": headers, "method": "POST", "path": "/"})


def test_signed_in_deliberation_records_user():
    persisted: list[dict] = []
    with (
        patch.object(main, "run_deliberation", _fake_deliberation),
        patch.object(main, "optional_user_id", return_value=USER_ID),
        patch.object(main, "_persist_governance_event", lambda _c, e: persisted.append(e)),
        TestClient(main.app) as client,
    ):
        response = client.post(
            "/deliberate",
            json={"question": "Should we renew the supplier contract?"},
            headers={"Authorization": "Bearer signed-in"},
        )
    assert response.status_code == 200
    assert [e.get("user_id") for e in persisted] == [USER_ID]


def test_no_bearer_means_no_user():
    assert optional_user_id(_request([])) is None


def test_rejected_token_is_anonymous_not_an_error():
    assert optional_user_id(_request([(b"authorization", b"Bearer not-a-jwt")])) is None

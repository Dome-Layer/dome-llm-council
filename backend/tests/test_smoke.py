from fastapi.testclient import TestClient

from main import app


def test_app_imports():
    assert app.title == "Dome LLM Council"


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

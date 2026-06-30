from app.config import Settings


def test_cors_origin_list_splits_and_strips():
    settings = Settings(cors_origins="http://localhost:3000, https://example.com , ")
    assert settings.cors_origin_list == [
        "http://localhost:3000",
        "https://example.com",
    ]


def test_cors_origin_list_empty_string():
    settings = Settings(cors_origins="")
    assert settings.cors_origin_list == []


def test_default_congress_number():
    settings = Settings()
    assert settings.congress_number == 119


def test_default_cache_ttl():
    settings = Settings()
    assert settings.cache_ttl_seconds == 86400
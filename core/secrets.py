SERVICE_NAME = 'bookmark'


def get_api_key(provider):
    """Read a cloud provider's API key from the OS keychain. Raises RuntimeError if
    missing or if no OS secret-service backend is available — callers should not
    silently fall back, since that's exactly the bug being fixed here."""
    import keyring

    try:
        key = keyring.get_password(SERVICE_NAME, provider)
    except Exception as e:
        raise RuntimeError(
            f"Could not read {provider} API key from the OS keychain: {e}"
        ) from e
    if not key:
        raise RuntimeError(
            f"No API key stored for provider '{provider}'. Complete setup with a "
            f"{provider} API key first."
        )
    return key


def set_api_key(provider, value):
    import keyring
    keyring.set_password(SERVICE_NAME, provider, value)

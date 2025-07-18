from pydantic import SecretStr

from core.logger import openhands_logger as logger
from extensions.integrations.bitbucket.bitbucket_service import BitbucketService
from extensions.integrations.github.github_service import GitHubService
from extensions.integrations.gitlab.gitlab_service import GitLabService
from extensions.integrations.service_types import ProviderType


async def validate_provider_token(
    token: SecretStr, base_domain: str | None = None
) -> ProviderType | None:
    """Determine whether a token is for GitHub, GitLab, or Bitbucket by attempting to get user info
    from the services.

    Args:
        token: The token to check
        base_domain: Optional base domain for the service

    Returns:
        'github' if it's a GitHub token
        'gitlab' if it's a GitLab token
        'bitbucket' if it's a Bitbucket token
        None if the token is invalid for all services
    """
    # Skip validation for empty tokens
    if token is None:
        return None

    # Try GitHub first
    github_error = None
    try:
        github_service = GitHubService(token=token, base_domain=base_domain)
        await github_service.verify_access()
        return ProviderType.GITHUB
    except Exception as e:
        github_error = e

    # Try GitLab next
    gitlab_error = None
    try:
        gitlab_service = GitLabService(token=token, base_domain=base_domain)
        await gitlab_service.get_user()
        return ProviderType.GITLAB
    except Exception as e:
        gitlab_error = e

    # Try Bitbucket last
    bitbucket_error = None
    try:
        bitbucket_service = BitbucketService(token=token, base_domain=base_domain)
        await bitbucket_service.get_user()
        return ProviderType.BITBUCKET
    except Exception as e:
        bitbucket_error = e

    logger.debug(
        f'Failed to validate token: {github_error} \n {gitlab_error} \n {bitbucket_error}'
    )

    return None

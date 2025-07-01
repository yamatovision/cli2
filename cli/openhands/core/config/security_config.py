from pydantic import BaseModel, Field, ValidationError


class SecurityConfig(BaseModel):
    """Configuration for security related functionalities.

    Attributes:
        confirmation_mode: Whether to enable confirmation mode.
        agent_switch_confirmation: Whether to enable confirmation mode for agent switching.
        agent_switch_logging: Whether to enable logging for agent switching.
        security_analyzer: The security analyzer to use.
    """

    confirmation_mode: bool = Field(default=False)
    agent_switch_confirmation: bool = Field(default=True)
    agent_switch_logging: bool = Field(default=True)
    security_analyzer: str | None = Field(default=None)

    model_config = {'extra': 'forbid'}

    @classmethod
    def from_toml_section(cls, data: dict) -> dict[str, 'SecurityConfig']:
        """
        Create a mapping of SecurityConfig instances from a toml dictionary representing the [security] section.

        The configuration is built from all keys in data.

        Returns:
            dict[str, SecurityConfig]: A mapping where the key "security" corresponds to the [security] configuration
        """

        # Initialize the result mapping
        security_mapping: dict[str, SecurityConfig] = {}

        # Try to create the configuration instance
        try:
            security_mapping['security'] = cls.model_validate(data)
        except ValidationError as e:
            raise ValueError(f'Invalid security configuration: {e}')

        return security_mapping

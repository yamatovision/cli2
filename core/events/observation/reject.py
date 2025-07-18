from dataclasses import dataclass

from core.schema import ObservationType
from core.events.observation.observation import Observation


@dataclass
class UserRejectObservation(Observation):
    """This data class represents the result of a rejected action."""

    observation: str = ObservationType.USER_REJECTED

    @property
    def message(self) -> str:
        return self.content

from __future__ import annotations

from core.config.condenser_config import ObservationMaskingCondenserConfig
from core.events.event import Event
from core.events.observation import Observation
from core.events.observation.agent import AgentCondensationObservation
from core.storage.condenser.condenser import Condensation, Condenser, View


class ObservationMaskingCondenser(Condenser):
    """A condenser that masks the values of observations outside of a recent attention window."""

    def __init__(self, attention_window: int = 5):
        self.attention_window = attention_window

        super().__init__()

    def condense(self, view: View) -> View | Condensation:
        """Replace the content of observations outside of the attention window with a placeholder."""
        results: list[Event] = []
        for i, event in enumerate(view):
            if isinstance(event, Observation) and i < len(view) - self.attention_window:
                results.append(AgentCondensationObservation('<MASKED>'))
            else:
                results.append(event)

        return View(events=results)

    @classmethod
    def from_config(  # type: ignore
        cls, config: ObservationMaskingCondenserConfig
    ) -> ObservationMaskingCondenser:
        return ObservationMaskingCondenser(**config.model_dump(exclude={'type'}))


ObservationMaskingCondenser.register_config(ObservationMaskingCondenserConfig)

from dataclasses import dataclass

from core.events.event import Event


@dataclass
class Observation(Event):
    content: str
